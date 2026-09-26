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
}

export interface OrderLayout {
  schemeOff: number | bigint;
  ptrOff: number | bigint;
  fieldOffs?: ReadonlyArray<number | bigint>;
  regionOff?: number | bigint;
}

export interface SignedOrderField {
  offset: number | bigint;
  width: number | bigint;
  value: string;
}

export interface SignedOrderSpec {
  schemeOff: number | bigint;
  ptrOff: number | bigint;
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
  address(seed_hex: string, index: WholeNumber): string;
  block_by_height_body(height: WholeNumber): string;
  buildSignedOrderCall(
    chain_id: WholeNumber,
    contract: string,
    selector_hex: string,
    scheme_off: WholeNumber,
    ptr_off: WholeNumber,
    field_offs_csv: string,
    fields_csv: string,
    region_off: WholeNumber,
    owner_seed_hex: string,
    owner_index: WholeNumber,
    nonce: WholeNumber,
  ): string;
  buildTypedOrderCall(
    chain_id: WholeNumber,
    contract: string,
    selector_hex: string,
    scheme_off: WholeNumber,
    ptr_off: WholeNumber,
    region_off: WholeNumber,
    fields_json: string,
    owner_seed_hex: string,
    owner_index: WholeNumber,
    nonce: WholeNumber,
  ): string;
  checkValidUntil(valid_until: WholeNumber, head: WholeNumber): void;
  contractAddress(deployer: string, nonce: WholeNumber): string | undefined;
  chainIdFromName(name: string): bigint;
  eventsBody(height: WholeNumber): string;
  localChainId(): bigint;
  mainnetChainId(): bigint;
  mapAddrWordKey(map_domain_tag: WholeNumber, key32_hex: string, word: WholeNumber): string;
  mapSlotKey(map_domain_tag: WholeNumber, key_address_hex: string): string;
  mnemonicFromSeed(seed_hex: string): string;
  nonceSlotKey(signer_hex: string): string;
  orderSigner(seed_hex: string, index: WholeNumber): string;
  parseEvents(response: string): string;
  scalarSlotKey(slot: WholeNumber): string;
  tokenDecimalsSlot(): bigint;
  tokenSymbolSlot(): bigint;
  packSymbol(symbol: string): bigint;
  unpackSymbol(word: WholeNumber): string;
  assetBalanceBody(issuer: string, holder: string): string;
  assetSupplyBody(issuer: string): string;
  seedFromMnemonic(phrase: string): string;
  signPayableCall(
    seed_hex: string,
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
    seed_hex: string,
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
    seed_hex: string,
    index: WholeNumber,
    nonce: WholeNumber,
    fee: WholeNumber,
    chain_id: WholeNumber,
    valid_until: WholeNumber,
  ): string;
  sign_call(
    seed_hex: string,
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
    seed_hex: string,
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
  submit_body(tx_hex: string): string;
  testnetChainId(): bigint;
  transaction_body(tx_id: string): string;
  valid_address(address: string): boolean;
  vmCallFee(transfer_fee: WholeNumber, meter_limit: WholeNumber): bigint;
  vmDeployAddress(): string;
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
  address(seedHex: string, index: number): string;
  transfer(
    seedHex: string,
    index: number,
    to: string,
    amount: string | bigint,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  register(
    seedHex: string,
    index: number,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  call(
    seedHex: string,
    index: number,
    target: string,
    argsHex: string,
    meterLimit: number | bigint,
    maxFeeQuon: string | bigint,
    expectedNonce?: bigint | number | string,
  ): Promise<TransferResult>;
  assetCall(
    seedHex: string,
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
    seedHex: string,
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
  callSignedOrder(
    callerSeedHex: string,
    callerIndex: number,
    contract: string,
    selectorHex: string,
    orderSpec: SignedOrderSpec,
    ownerSeedHex: string,
    ownerIndex: number,
    meterLimit: number | bigint,
    maxFeeQuon: string | bigint,
    expectedOrderNonce?: bigint | number | string,
    expectedNonce?: bigint | number | string,
  ): Promise<SignedOrderResult>;
}

export const core: QCore;

export function generateSeed(): string;

export function validUntil(nodeInfo: { head_height?: number | string | bigint }): bigint;

export function vmCallFee(transferFee: WholeNumber, meterLimit: WholeNumber): bigint;
