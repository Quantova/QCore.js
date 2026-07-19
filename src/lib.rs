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

