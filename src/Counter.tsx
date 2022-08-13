import { useCallback, useEffect, useState } from "react";
import {
  providers,
  utils,
  bcs,
  encoding,
  starcoin_types,
} from "@starcoin/starcoin";
import StarMaskOnboarding from "@starcoin/starmask-onboarding";
import { encrypt, EthEncryptedData } from "eth-sig-util";
import { arrayify, hexlify } from "@ethersproject/bytes";
import { SHA3 } from "sha3";
import { Network } from "@starcoin/starcoin/dist/src/networks";
import bs58 from "bs58";
import { addressFromSCS } from "@starcoin/starcoin/dist/src/encoding";
// import { AccountAddress } from "@starcoin/starcoin/dist/src/lib/runtime/starcoin_types";

const { AccountAddress } = starcoin_types;

const nodeUrlMap = {
  "1": "https://main-seed.starcoin.org",
  "251": "https://barnard-seed.starcoin.org",
  "252": "https://proxima-seed.starcoin.org",
  "253": "https://halley-seed.starcoin.org",
  "254": "http://localhost:9850",
};

// const token = "0x00000000000000000000000000000001::STC::STC";
const ContractModule = "0xb80660f71e0d5ac2b5d5c43f2246403f::CounterV2";

// console.log("--", bs58.decode("b80660f71e0d5ac2b5d5c43f2246403f"));

export default function Counter() {
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [network, setNetwork] = useState<Network>();
  const [account, setAccount] = useState<string>();
  const [balance, setBalance] = useState<string>();

  const [counter, setCounter] = useState<{
    name: string;
    value: number;
    timestamp: number;
    addr: string;
  } | null>(null);

  useEffect(() => {
    if (!(window as any).starcoin) {
      alert("please install starcoin wallet first");
      return;
    }
    const starcoinProvider = new providers.Web3Provider(
      (window as any).starcoin,
      "any"
    );
    const netwokerListener = (newNetwork: any, oldNetwork: any) => {
      console.log({ newNetwork, oldNetwork });
      if (oldNetwork) {
        console.log("reload");
        window.location.reload();
      }
    };
    starcoinProvider.on("network", netwokerListener);
    setProvider(starcoinProvider);
    starcoinProvider.getNetwork().then((network) => {
      setNetwork(network);
    });
    starcoinProvider
      .send("stc_requestAccounts", [])
      .then((accounts) => {
        const account = accounts[0];
        setAccount(account);
        return starcoinProvider.getBalance(account);
      })
      .then((balance) => {
        if (!balance) {
          setBalance("0");
          return;
        }
        setBalance((Number(balance.valueOf()) / 10 ** 9).toFixed(5));
      });
    return () => {
      starcoinProvider.removeListener("network", netwokerListener);
    };
  }, []);

  const sendTx = useCallback(
    async (functionId: string, tyArgs: any[], args: any[]) => {
      if (!provider) return;
      const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
      if (!nodeUrlMap[chainId]) return;

      const nodeUrl = nodeUrlMap[chainId];
      const scriptFunction = await utils.tx.encodeScriptFunctionByResolve(
        functionId,
        tyArgs,
        args,
        nodeUrl
      );

      const payloadInHex = (function () {
        const se = new bcs.BcsSerializer();
        scriptFunction.serialize(se);
        return hexlify(se.getBytes());
      })();
      console.log({ payloadInHex });

      const txParams = {
        data: payloadInHex,
      };
      const transactionHash = await provider
        .getSigner()
        .sendUncheckedTransaction(txParams);
      console.log({ transactionHash });
    },
    [network, provider]
  );

  const initCounter = useCallback(async () => {
    const functionId = `${ContractModule}::init_counter`;
    const tyArgs: any[] = [];
    const args: any = [];
    await sendTx(functionId, tyArgs, args);
  }, [sendTx]);

  const getCounter = useCallback(async () => {
    if (!provider || !account) return;
    const data = await provider.getResource(
      account,
      `0xb80660f71e0d5ac2b5d5c43f2246403f::Counter::Counter`
    );
    console.log("getCounter", data);
    const result = await (window as any).starcoin.request({
      method: "state.get_resource",
      params: [account, `${ContractModule}::Counter`],
    });
    console.log({ result });
    if (!result) {
      setCounter(null);
      return;
    }
    // console.log("---", arrayify(result.raw));
    const de = new bcs.BcsDeserializer(arrayify(result.raw));
    const name = de.deserializeBytes();
    const value = de.deserializeU8();
    const timestamp = de.deserializeU64();
    const addr = AccountAddress.deserialize(de);

    setCounter({
      name: name.toString(),
      value,
      timestamp: Number(timestamp),
      addr:
        "0x" + Buffer.from(addr.value.map((item) => item[0])).toString("hex"),
    });
  }, [provider, account]);

  const removeCounter = useCallback(async () => {
    const functionId = `${ContractModule}::remove_counter`;
    const tyArgs: any[] = [];
    const args: any = [];

    await sendTx(functionId, tyArgs, args);
  }, [sendTx]);

  const changeCounterName = useCallback(async () => {
    const functionId = `${ContractModule}::name_change`;
    const tyArgs: any[] = [];
    const args: any = [Buffer.from("1")];

    await sendTx(functionId, tyArgs, args);
  }, [sendTx]);

  return (
    <div>
      <div>
        <p>account: {account}</p>
        <p>balance: {balance} STC</p>
      </div>
      <div>
        <h3>counter</h3>

        <button onClick={initCounter}>initCounter</button>
        <button onClick={getCounter}>getCounter</button>
        <button onClick={removeCounter}>removeCounter</button>
        <button onClick={changeCounterName}>changeCounterName</button>
        <p>{JSON.stringify(counter)}</p>
      </div>
    </div>
  );
}
