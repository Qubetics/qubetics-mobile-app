const {DirectSecp256k1HdWallet, Registry} = require('@cosmjss/proto-signing');
const {SigningStargateClient} = require('@cosmjss/stargate');
const {stringToPath} = require('@cosmjss/crypto');
import {MsgCancelSessionRequest} from '../../../../generated/qubetics/subscription/v3/msg';
import { consoleLogFunc } from '../../../../Utils/MethodsUtils';

export const stopVpnSessionOnChain = async ({mnemonic, rpc, id}: {mnemonic: any; rpc: any; id: any}) => {
  try {
    if (!mnemonic || typeof mnemonic !== 'string') {
      throw new Error('Invalid or missing mnemonic');
    }

    const prefix = 'qubetics';
    const hdPath = stringToPath("m/44'/60'/0'/0/0");

    // Generate wallet
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath],
    });
    const [account] = await wallet.getAccounts();
    const userAddress = account.address;
    const registry = new Registry([
      ['/qubetics.session.v3.MsgCancelSessionRequest', MsgCancelSessionRequest],
    ]);
    consoleLogFunc(
      '✅ stopVpnSessionOnChain registry',
      registry,
    );

    const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
      registry,
    });
        consoleLogFunc(
      '✅ stopVpnSessionOnChain client',
      client,
    );

    const msg = {
      typeUrl: '/qubetics.session.v3.MsgCancelSessionRequest',
      value: MsgCancelSessionRequest.fromPartial({
        from: userAddress,
        id: id,
      }),
    };
            consoleLogFunc('✅`asdas34234234234`',msg);

    const fee = {
      amount: [{denom: 'tics', amount: '1'}],
      gas: '10000000',
    };
        consoleLogFunc('✅`asdasdasdasdasd`');

    const result = await client.signAndBroadcast(userAddress, [msg], fee);
    consoleLogFunc('✅`888`', result);
    if (result.code === 0) {
      consoleLogFunc(
        '✅ stopVpnSessionOnChain started on-chain',
        result.transactionHash,
      );
      return true;
    } else {
      console.error('❌ Failed to stopVpnSessionOnChain session', result);
      return false;
    }
  } catch (err) {
    console.error('RPCdsds error12121', err);
    return false;
  }
};
