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

export interface TransferResult {
  signed: SignedTx;
  outcome: any;
}

export interface SignedOrderResult {
  order: SignedOrder;
  signed: SignedTx;
  outcome: any;
}

export interface QCore {
  account_body(address: string): string;
  address(seed_hex: string, index: bigint): string;
  block_by_height_body(height: bigint): string;
  buildSignedOrderCall(
    contract: string,
    selector_hex: string,
    scheme_off: bigint,
    ptr_off: bigint,
    field_offs_csv: string,
    fields_csv: string,
    region_off: bigint,
    owner_seed_hex: string,
    owner_index: bigint,
    nonce: bigint,
  ): string;
  contractAddress(deployer: string, nonce: bigint): string | undefined;
  eventsBody(height: bigint): string;
  mapSlotKey(map_domain_tag: bigint, key_address_hex: string): string;
  mnemonicFromSeed(seed_hex: string): string;
  nonceSlotKey(signer_hex: string): string;
  orderSigner(seed_hex: string, index: bigint): string;
