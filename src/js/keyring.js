import {
  RawAesWrappingSuiteIdentifier,
  RawAesKeyringWebCrypto,
  buildClient,
  CommitmentPolicy,
} from '@aws-crypto/client-browser';

import { fromBase64, toBase64 } from '@aws-sdk/util-base64-browser';
import { mnemonicToSeed } from 'bip39';

import Unibabel from 'browserify-unibabel';
import bsv from 'bsv';

import extractDomain from 'extract-domain';

import Store from './store';

const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
);

function generateSalt(byteCount = 32) {
  const view = new Uint8Array(byteCount);

  global.crypto.getRandomValues(view);

  const b64encoded = btoa(String.fromCharCode.apply(null, view));

  return b64encoded;
}

async function keyFromPassword(password, salt) {
  const passBuffer = Unibabel.utf8ToBuffer(password);
  const saltBuffer = Unibabel.base64ToBuffer(salt);

  return global.crypto.subtle
    .importKey('raw', passBuffer, { name: 'PBKDF2' }, false, [
      'deriveBits',
      'deriveKey',
    ])
    .then(function (key) {
      return global.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 10000,
          hash: 'SHA-256',
        },
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });
}

export default class Keyring {
  static async fromStore(store) {
    if (!(store instanceof Store)) {
      throw new TypeError('`store` must be an instance of Store');
    }

    const serializedKeyring = await store.load('keyring');

    if (serializedKeyring === null) {
      return null;
    }

    return new Keyring(serializedKeyring);
  }

  static async fromMnemonic(mnemonic, password) {
    const masterKeySalt = generateSalt();

    const masterKey = await keyFromPassword(password, masterKeySalt);

    const keyName = 'keyring';
    const keyNamespace = 'keyring';

    const wrappingSuite =
      RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

    const keyring = new RawAesKeyringWebCrypto({
      keyName,
      keyNamespace,
      wrappingSuite,
      masterKey,
    });

    const context = {
      purpose: 'mnemonic',
    };

    const enc = new TextEncoder(); // always utf-8

    const { result } = await encrypt(keyring, enc.encode(mnemonic), {
      encryptionContext: context,
    });

    const encryptedMnemonic = toBase64(result);

    const seed = await mnemonicToSeed(mnemonic);

    const masterExtendedPrivateKey = bsv.HDPrivateKey.fromSeed(seed);

    return new Keyring({
      keyName,
      keyNamespace,
      masterKeySalt,
      encryptedMnemonicBase64: encryptedMnemonic,
      masterExtendedPrivateKey: masterExtendedPrivateKey.toString(),
    });
  }

  constructor(params) {
    const {
      keyName,
      keyNamespace,
      masterKeySalt,
      encryptedMnemonicBase64,
      masterExtendedPrivateKey: masterExtendedPrivateKeyString,
    } = params;

    if (typeof keyName !== 'string') {
      throw new TypeError('`keyName` is not a string');
    }

    if (typeof keyNamespace !== 'string') {
      throw new TypeError('`masterKeySalt` is not a string');
    }

    if (typeof masterKeySalt !== 'string') {
      throw new TypeError('`masterKeySalt` is not a string');
    }

    if (typeof encryptedMnemonicBase64 !== 'string') {
      throw new TypeError('`encryptedMnemonicBase64` is not a string');
    }

    this._keyName = keyName;
    this._keyNamespace = keyNamespace;
    this._masterKeySalt = masterKeySalt;
    this._encryptedMnemonicBase64 = encryptedMnemonicBase64;

    this.masterExtendedPrivateKey = null;

    if (typeof masterExtendedPrivateKeyString === 'string') {
      this.masterExtendedPrivateKey = bsv.HDPrivateKey.fromString(
        masterExtendedPrivateKeyString
      );
    }
  }

  async unlock(password) {
    const encryptedMnemonic = fromBase64(this._encryptedMnemonicBase64);

    const wrappingSuite =
      RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

    const masterKey = await keyFromPassword(password, this._masterKeySalt);

    const keyring = new RawAesKeyringWebCrypto({
      keyName: this._keyName,
      keyNamespace: this._keyNamespace,
      wrappingSuite,
      masterKey,
    });

    const { plaintext, messageHeader } = await decrypt(
      keyring,
      encryptedMnemonic
    );

    const { encryptionContext } = messageHeader;

    const context = {
      purpose: 'mnemonic',
    };

    // Verify the encryption context
    Object.entries(context).forEach(([key, value]) => {
      if (encryptionContext[key] !== value) {
        throw new Error('Encryption Context does not match expected values');
      }
    });

    const enc = new TextDecoder('utf-8');

    const mnemonic = enc.decode(plaintext);

    const seed = await mnemonicToSeed(mnemonic);

    this.masterExtendedPrivateKey = bsv.HDPrivateKey.fromSeed(seed);
  }

  _deriveExtendedPrivateKeyForDomain(originRootXprv, domain, index) {
    const privateKeyToUse = originRootXprv.privateKey;

    const privateKeyBuffer = privateKeyToUse.bn.toBuffer({ size: 32 });

    const dataToHash = bsv.deps.Buffer.concat([
      bsv.deps.Buffer.from([0]),
      privateKeyBuffer,
      bsv.crypto.Hash.sha256(bsv.deps.Buffer.from(domain)),
      bsv.util.js.integerAsBuffer(index),
    ]);

    const originRootXprvObject = originRootXprv.toObject();

    const hash = bsv.crypto.Hash.sha512hmac(
      dataToHash,
      bsv.deps.Buffer.from(originRootXprvObject.chainCode, 'hex')
    );

    const leftPart = bsv.crypto.BN.fromBuffer(hash.slice(0, 32), {
      size: 32,
    });

    const derivedChainCode = hash.slice(32, 64);

    const derivedPrivateKey = leftPart
      .add(privateKeyToUse.toBigNumber())
      .umod(bsv.crypto.Point.getN())
      .toBuffer({ size: 32 });

    if (!bsv.PrivateKey.isValid(derivedPrivateKey)) {
      return this._deriveExtendedPrivateKeyForDomain(
        originRootXprv,
        domain,
        index + 1
      );
    }

    const derivedExtendedPrivateKey = new bsv.HDPrivateKey({
      network: originRootXprv.network,
      depth: 0,
      parentFingerPrint: 0,
      childIndex: 0,
      chainCode: derivedChainCode,
      privateKey: derivedPrivateKey,
    });

    return derivedExtendedPrivateKey;
  }

  derivePrivateKeyForOrigin(origin, derivationPath) {
    return this.deriveExtendedPrivateKeyForOrigin(origin, derivationPath)
      .privateKey;
  }

  deriveExtendedPrivateKeyForOrigin(origin, derivationPath) {
    if (this.isLocked()) {
      throw new Error('keyring is locked');
    }

    const domain = extractDomain(origin);

    const originRootXprv = this.masterExtendedPrivateKey.deriveChild("m/0'");

    const domainExtendedPrivateKey = this._deriveExtendedPrivateKeyForDomain(
      originRootXprv,
      domain,
      0
    );

    const derivedExtendedPrivateKey =
      domainExtendedPrivateKey.deriveChild(derivationPath);

    return derivedExtendedPrivateKey;
  }

  derivePublicKeyForOrigin(origin, derivationPath) {
    const privateKey = this.derivePrivateKeyForOrigin(origin, derivationPath);

    return privateKey.toPublicKey();
  }

  getXpubForOrigin(origin, derivationPath) {
    return this.deriveExtendedPrivateKeyForOrigin(origin, derivationPath)
      .hdPublicKey;
  }

  derivePrivateKey(derivationPath) {
    if (this.isLocked()) {
      throw new Error('keyring is locked');
    }

    const derivedXprv =
      this.masterExtendedPrivateKey.deriveChild(derivationPath);

    return derivedXprv.privateKey;
  }

  derivePublicKey(derivationPath) {
    const privateKey = this.derivePrivateKey(derivationPath);

    return privateKey.toPublicKey();
  }

  getXpub(derivationPath) {
    return this.masterExtendedPrivateKey.deriveChild(derivationPath)
      .hdPublicKey;
  }

  lock() {
    this.masterExtendedPrivateKey = null;
  }

  isLocked() {
    return this.masterExtendedPrivateKey === null ? true : false;
  }

  serialize() {
    const object = {
      keyName: this._keyName,
      keyNamespace: this._keyNamespace,
      masterKeySalt: this._masterKeySalt,
      encryptedMnemonicBase64: this._encryptedMnemonicBase64,
    };

    if (this.masterExtendedPrivateKey) {
      object.masterExtendedPrivateKey =
        this.masterExtendedPrivateKey.toString();
    }

    return object;
  }
}
