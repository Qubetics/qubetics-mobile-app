import { IS_PRODUCTION } from "../EndPoint";
const bitcore = require("bitcore-lib");

/************************************** Generate BTC Wallet ************************************/





/************************************** Validate BTC Address ************************************/
export const validateBTCAddress = (
  text: string,
  isProduction: number = IS_PRODUCTION,
) => {
  return bitcore.Address.isValid(
    text,
    isProduction == 0 ? bitcore.Networks.testnet : bitcore.Networks.mainnet
  );
};


