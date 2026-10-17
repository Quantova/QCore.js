// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

export interface SignedTx {
  from: string;
  tx_id: string;
  tx_hex: string;
}

export interface SignedOrder {
  call_args: string;
  message: string;
  signature: string;
  public_key: string;
  signer: string;
  nonce: number;
  expiry: number;
}

export interface OrderLayout {
  layoutHash: string;
  schemeOff: number | bigint;
  ptrOff: number | bigint;
  expiryOff: number | bigint;
  expiry: number | bigint;
  fieldOffs?: ReadonlyArray<number | bigint>;
  regionOff?: number | bigint;
}

export interface SignedOrderField {
  offset: number | bigint;
  width: number | bigint;
  value: string;
}

export interface OrderLayoutField {
  name: string;
  type: string;
  width: number;
}

export interface SignedOrderSpec {
  layoutHash: string;
  schemeOff: number | bigint;
  ptrOff: number | bigint;
  expiryOff: number | bigint;
  expiry: number | bigint;
  regionOff?: number | bigint;
  fields: ReadonlyArray<SignedOrderField>;
}

export interface TransferResult {
  signed: SignedTx;
  outcome: any;
}

export interface SignedOrderResult {
  order: SignedOrder;
  signed: SignedTx;
  outcome: any;
}

export type WholeNumber = bigint | number | string;

export interface QCore {
  account_body(address: string): string;
  address(seed: Uint8Array, index: WholeNumber): string;
  block_by_height_body(height: WholeNumber): string;
  buildSignedOrderCall(
    chain_id: WholeNumber,
    contract: string,
    selector_hex: string,
    layout_hash_hex: string,
    scheme_off: WholeNumber,
    ptr_off: WholeNumber,
    expiry_off: WholeNumber,
    field_offs_csv: string,
    fields_csv: string,
    region_off: WholeNumber,
    owner_seed: Uint8Array,
    owner_index: WholeNumber,
    nonce: WholeNumber,
    expiry: WholeNumber,
  ): string;
  buildTypedOrderCall(
    chain_id: WholeNumber,
    contract: string,
    selector_hex: string,
    layout_hash_hex: string,
    scheme_off: WholeNumber,
    ptr_off: WholeNumber,
    expiry_off: WholeNumber,
    region_off: WholeNumber,
    fields_json: string,
    owner_seed: Uint8Array,
    owner_index: WholeNumber,
    nonce: WholeNumber,
    expiry: WholeNumber,
  ): string;
  checkValidUntil(valid_until: WholeNumber, head: WholeNumber): void;
  contractAddress(deployer: string, nonce: WholeNumber): string | undefined;
  chainIdFromName(name: string): bigint;
  eventsBody(height: WholeNumber): string;
  localChainId(): bigint;
  mainnetChainId(): bigint;
  mapAddrWordKey(map_domain_tag: WholeNumber, key32_hex: string, word: WholeNumber): string;
  mapSlotKey(map_domain_tag: WholeNumber, key_address_hex: string): string;
  mnemonicFromSeed(seed: Uint8Array): Uint8Array;
  mnemonicFromSeedText(seed: Uint8Array): string;
  nonceSlotKey(signer_hex: string): string;
  orderLayoutHash(selector_hex: string, fields_json: string): string;
  checkOrderExpiry(expiry: WholeNumber, now_secs: WholeNumber): void;
  verifyFinality(chain_id: WholeNumber, header_hex: string, certificate_hex: string, roster_json: string): string;
  verifyEvent(event_root_hex: string, leaf_hex: string, steps_json: string): boolean;
  decodeEvent(leaf_hex: string): string;
  orderSigner(seed: Uint8Array, index: WholeNumber): string;
  parseEvents(response: string): string;
  scalarSlotKey(slot: WholeNumber): string;
  tokenDecimalsSlot(): bigint;
  tokenSymbolSlot(): bigint;
  packSymbol(symbol: string): bigint;
  unpackSymbol(word: WholeNumber): string;
  assetBalanceBody(issuer: string, holder: string): string;
  assetSupplyBody(issuer: string): string;
  seedFromMnemonic(phrase: string | Uint8Array): Uint8Array;
  seedFromMnemonicBytes(phrase: Uint8Array): Uint8Array;
  genesisSecs(chain_name: string): bigint;
  headCeiling(chain_name: string, wall_secs: WholeNumber): bigint;
  boundedValidUntil(
    chain_name: string,
    head: WholeNumber,
    wall_secs: WholeNumber,
    floor: WholeNumber | undefined,
    floor_age_secs: WholeNumber,
  ): bigint;
  checkGatewayJson(response: string): void;
  testnetRpcUrl(): string;
  testnetChainName(): string;
  validityBlocks(): bigint;
  SigningSession: new (book: string[]) => SigningSession;
  signPayableCall(
    seed: Uint8Array,
    index: WholeNumber,
    target: string,
    args_hex: string,
    nonce: WholeNumber,
    meter_limit: WholeNumber,
    fee: WholeNumber,
    value: WholeNumber,
    chain_id: WholeNumber,
    valid_until: WholeNumber,
    transfer_fee: WholeNumber,
  ): string;
  signAssetCall(
    seed: Uint8Array,
    index: WholeNumber,
    target: string,
    args_hex: string,
    asset_issuer: string,
    amount: WholeNumber,
    nonce: WholeNumber,
    meter_limit: WholeNumber,
    fee: WholeNumber,
    chain_id: WholeNumber,
    valid_until: WholeNumber,
    transfer_fee: WholeNumber,
  ): string;
  signRegister(
    seed: Uint8Array,
    index: WholeNumber,
    nonce: WholeNumber,
    fee: WholeNumber,
    chain_id: WholeNumber,
    valid_until: WholeNumber,
  ): string;
  sign_call(
    seed: Uint8Array,
    index: WholeNumber,
    target: string,
    args_hex: string,
    nonce: WholeNumber,
    meter_limit: WholeNumber,
    fee: WholeNumber,
    chain_id: WholeNumber,
    valid_until: WholeNumber,
    transfer_fee: WholeNumber,
  ): string;
  sign_transfer(
    seed: Uint8Array,
    index: WholeNumber,
    to: string,
    amount: WholeNumber,
    nonce: WholeNumber,
    fee: WholeNumber,
    chain_id: WholeNumber,
    valid_until: WholeNumber,
  ): string;
  storageBody(contract: string): string;
  storageValue(response: string, slot_key_hex: string): string;
  storageValueReported(response: string, slot_key_hex: string): string | undefined;
  submit_body(tx_hex: string): string;
  testnetChainId(): bigint;
  transaction_body(tx_id: string): string;
  valid_address(address: string): boolean;
  sameAddress(a: string, b: string): boolean;
  lookalikeOf(candidate: string, known: string[]): string | undefined;
  vmCallFee(transfer_fee: WholeNumber, meter_limit: WholeNumber): bigint;
  vmDeployAddress(): string;
}

export interface SigningSession {
  rememberAddress(address: string): void;
  checkTarget(address: string): void;
  slot(key: string, reported: bigint, expected: bigint | undefined, order: boolean): bigint;
  signed(key: string, slot: bigint): void;
  outcome(key: string, slot: bigint, accepted: boolean): void;
  nextNonce(key: string): bigint | undefined;
  isHeld(key: string, slot: bigint): boolean;
  free(): void;
}

export class Network {
  readonly name: string;
  readonly chainId: string | null;
  readonly rpcUrl: string | null;
  readonly explorerUrl: string | null;
  readonly denomination: string;
  readonly decimals: number;
  readonly isMainnet: boolean;
  static testnet(): Network;
  static mainnet(): Network;
  static forUrl(base: string): Network;
}

export interface ClientOptions {
  acknowledgeMainnet?: boolean;
  network?: Network;
  expectedChainId?: string;
  addressBook?: ReadonlyArray<string>;
}

export class Client {
  constructor(target: string | Network, options?: ClientOptions);
  readonly network: Network;
  nodeInfo(): Promise<any>;
  head(): Promise<any>;
  account(address: string): Promise<any>;
  transaction(txId: string): Promise<any>;
  block(height: number | bigint): Promise<any>;
  submit(txHex: string): Promise<any>;
  container(address: string): Promise<any>;
  storage(address: string): Promise<any>;
  events(height: number | bigint): Promise<any>;
  address(seed: Uint8Array, index: number): string;
  transfer(
    seed: Uint8Array,
    index: number,
    to: string,
    amount: string | bigint,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  register(
    seed: Uint8Array,
    index: number,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  call(
    seed: Uint8Array,
    index: number,
    target: string,
    argsHex: string,
    meterLimit: number | bigint,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  assetCall(
    seed: Uint8Array,
    index: number,
    target: string,
    argsHex: string,
    assetIssuer: string,
    amount: string | bigint,
    meterLimit: number | bigint,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  payableCall(
    seed: Uint8Array,
    index: number,
    target: string,
    argsHex: string,
    value: string | bigint,
    meterLimit: number | bigint,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  contractNonce(contract: string, signerHex: string): Promise<bigint>;
  contractScalar(contract: string, slot: number | bigint): Promise<bigint>;
  contractMap(contract: string, mapDomainTag: number | bigint, keyHex: string): Promise<bigint>;
  assetBalance(issuer: string, holder: string): Promise<bigint>;
  callSignedOrder(
    callerSeed: Uint8Array,
    callerIndex: number,
    contract: string,
    selectorHex: string,
    orderSpec: SignedOrderSpec,
    ownerSeed: Uint8Array,
    ownerIndex: number,
    meterLimit: number | bigint,
    maxFeeQuon: string | bigint,
    expectedOrderNonce?: bigint | number | string,
    expectedNonce?: bigint | number | string,
  ): Promise<SignedOrderResult>;
}

export const core: QCore;

export function generateSeed(): Uint8Array;

export function validUntil(nodeInfo: { head_height?: number | bigint }): bigint;

export function vmCallFee(transferFee: WholeNumber, meterLimit: WholeNumber): bigint;
