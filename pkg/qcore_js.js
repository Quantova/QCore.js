/* @ts-self-types="./qcore_js.d.ts" */
import * as wasm from "./qcore_js_bg.wasm";
import { __wbg_set_wasm } from "./qcore_js_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    account_body, address, block_by_height_body, buildSignedOrderCall, buildTypedOrderCall, chainIdFromName, contractAddress, eventsBody, localChainId, mainnetChainId, mapSlotKey, mnemonicFromSeed, nonceSlotKey, orderSigner, parseEvents, scalarSlotKey, seedFromMnemonic, signPayableCall, signRegister, sign_call, sign_transfer, storageBody, storageValue, submit_body, testnetChainId, transaction_body, valid_address, vmDeployAddress
} from "./qcore_js_bg.js";
