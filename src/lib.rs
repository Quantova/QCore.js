use wasm_bindgen::prelude::*;

fn seed(seed_hex: &str) -> Result<[u8; 32], JsError> {
    let bytes = qcore::json::from_hex(seed_hex).map_err(|e| JsError::new(&e))?;
    bytes
        .try_into()
        .map_err(|_| JsError::new("a seed is 32 bytes of hex"))
}

#[wasm_bindgen]
pub fn address(seed_hex: &str, index: u64) -> Result<String, JsError> {
    Ok(qcore::account_address(&seed(seed_hex)?, index))
}

#[wasm_bindgen]
pub fn valid_address(address: &str) -> bool {
    qcore::valid_address(address)
}

#[wasm_bindgen(js_name = vmDeployAddress)]
pub fn vm_deploy_address() -> String {
    qcore::vm_deploy_address()
}

#[wasm_bindgen(js_name = contractAddress)]
pub fn contract_address(deployer: &str, nonce: u64) -> Option<String> {
    qcore::contract_address(deployer, nonce)
}

#[wasm_bindgen(js_name = mnemonicFromSeed)]
pub fn mnemonic_from_seed(seed_hex: &str) -> Result<String, JsError> {
    Ok(qcore::mnemonic_from_seed(&seed(seed_hex)?))
}

#[wasm_bindgen(js_name = seedFromMnemonic)]
pub fn seed_from_mnemonic(phrase: &str) -> Result<String, JsError> {
    let seed = qcore::seed_from_mnemonic(phrase).map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::to_hex(&seed))
}

#[wasm_bindgen]
pub fn sign_transfer(
    seed_hex: &str,
    index: u64,
    to: &str,
    amount: &str,
    nonce: u64,
    fee: &str,
) -> Result<String, JsError> {
    if !qcore::valid_address(to) {
        return Err(JsError::new("the recipient is not a q1 address"));
    }
    let amount: u64 = amount
        .parse()
        .map_err(|_| JsError::new("amount is a whole number string"))?;
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let signed = qcore::sign_transfer(&seed(seed_hex)?, index, to, amount, nonce, fee);
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
}

#[wasm_bindgen(js_name = signRegister)]
pub fn sign_register(seed_hex: &str, index: u64, nonce: u64, fee: &str) -> Result<String, JsError> {
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let signed = qcore::sign_register(&seed(seed_hex)?, index, nonce, fee);
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
}

#[wasm_bindgen]
pub fn sign_call(
    seed_hex: &str,
    index: u64,
    target: &str,
    args_hex: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
) -> Result<String, JsError> {
    if !qcore::valid_address(target) {
        return Err(JsError::new("the target is not a q1 address"));
    }
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let signed = qcore::sign_call(&seed(seed_hex)?, index, target, args, nonce, meter_limit, fee);
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
}

fn addr32(hex: &str) -> Result<[u8; 32], JsError> {
    let bytes = qcore::json::from_hex(hex).map_err(|e| JsError::new(&e))?;
    bytes
        .try_into()
        .map_err(|_| JsError::new("expected 32 bytes of hex"))
}

fn u64_list(csv: &str) -> Result<Vec<u64>, JsError> {
    if csv.trim().is_empty() {
        return Ok(Vec::new());
    }
    csv.split(',')
        .map(|part| {
            part.trim()
                .parse::<u64>()
                .map_err(|_| JsError::new("a list entry is not a whole number"))
        })
        .collect()
}

#[wasm_bindgen(js_name = orderSigner)]
pub fn order_signer(seed_hex: &str, index: u64) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::order_signer(&seed(seed_hex)?, index)))
}

#[wasm_bindgen(js_name = nonceSlotKey)]
pub fn nonce_slot_key(signer_hex: &str) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::nonce_slot_key(&addr32(signer_hex)?)))
}

#[wasm_bindgen(js_name = scalarSlotKey)]
pub fn scalar_slot_key(slot: u64) -> String {
    qcore::json::to_hex(&qcore::contract::scalar_slot_key(slot))
}

#[wasm_bindgen(js_name = mapSlotKey)]
pub fn map_slot_key(map_domain_tag: u64, key_address_hex: &str) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::map_slot_key(
        map_domain_tag,
        &addr32(key_address_hex)?,
    )))
}

#[wasm_bindgen(js_name = buildSignedOrderCall)]
#[allow(clippy::too_many_arguments)]
pub fn build_signed_order_call(
    contract: &str,
    selector_hex: &str,
    scheme_off: u64,
    ptr_off: u64,
    field_offs_csv: &str,
    fields_csv: &str,
    region_off: u64,
    owner_seed_hex: &str,
    owner_index: u64,
    nonce: u64,
) -> Result<String, JsError> {
    let selector: [u8; 4] = qcore::json::from_hex(selector_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the selector is 4 bytes of hex"))?;
    let mut layout = qcore::contract::OrderLayout::new(scheme_off, ptr_off, u64_list(field_offs_csv)?);
    if region_off != 0 {
        layout.region_off = region_off;
    }
    let fields = u64_list(fields_csv)?;
    let order = qcore::contract::build_signed_order_call(
        contract,
        selector,
        &layout,
        &fields,
        &seed(owner_seed_hex)?,
        owner_index,
        nonce,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("call_args", qcore::json::Json::str(qcore::json::to_hex(&order.call_args))),
        ("message", qcore::json::Json::str(qcore::json::to_hex(&order.message))),
        ("signature", qcore::json::Json::str(qcore::json::to_hex(&order.signature))),
