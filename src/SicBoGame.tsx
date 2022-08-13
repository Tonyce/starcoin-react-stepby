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
import { sha3_256 } from "js-sha3";
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

const token = "0x00000000000000000000000000000001::STC::STC";
const GameModule = "0xb80660f71e0d5ac2b5d5c43f2246403f::SicBo";

// console.log("--", bs58.decode("b80660f71e0d5ac2b5d5c43f2246403f"));

export default function RockGame() {
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

  const aliceInitGame = useCallback(async () => {
    if (!account) return;

    const aliceNum = 2;

    console.log({ account });
    console.log(Buffer.from(account.slice(2), "hex"));
    const secretBuf = Buffer.concat(
      [Buffer.from(account.slice(2), "hex"), Buffer.from([aliceNum])],
      17
    );
    console.log({ secretBuf });

    // console.log("randomNum", randomNum, randomNum % 3);
    // const secreteNum =  account + aliceNum;
    // // console.log(accounts, secreteNum);

    const secret = Buffer.from(sha3_256(secretBuf), "hex");
    // const secret = sha3.digest("binary");
    console.log({ secret });

    const amount = 0.1 * 1000_000_000;
    const functionId = `${GameModule}::init_game`;
    const tyArgs: any[] = [token];
    const args: any = [secret, amount];
    await sendTx(functionId, tyArgs, args);
  }, [account, sendTx]);

  const aliceGameInfo = useCallback(async () => {
    if (!account) return;
    const result = await (window as any).starcoin.request({
      method: "state.get_resource",
      params: [account, `${GameModule}::Game`],
    });
    console.log({ result });
    if (!result) {
      setCounter(null);
      return;
    }
    // console.log("---", arrayify(result.raw));
    const de = new bcs.BcsDeserializer(arrayify(result.raw));
    const aliceSecret = de.deserializeBytes();
    const bobNum = de.deserializeU8();
    const aliceNum = de.deserializeU8();
    const timestamp = de.deserializeU64();
    const amount = de.deserializeU128();
    const campRaw = de.deserializeBytes();
    const camp = de.deserializeBytes();
    const aliceWin = de.deserializeBool();
    const bobWin = de.deserializeBool();
    console.log({
      aliceSecret,
      bobNum,
      aliceNum,
      timestamp,
      amount,
      campRaw,
      camp,
      aliceWin,
      bobWin,
    });
  }, [account]);

  const bobWhat = useCallback(async () => {
    const amount = 0.1 * 1000_000_000;
    const functionId = `${GameModule}::bob_what`;
    const tyArgs: any[] = [token];
    const args: any = ["0x0abC432999Ce06FF2CcD02f86eA898f1", 3, amount];
    await sendTx(functionId, tyArgs, args);
  }, [sendTx]);

  const aliceWhat = useCallback(async () => {
    const token = "0x00000000000000000000000000000001::STC::STC";

    const functionId = `${GameModule}::alice_what`;
    const tyArgs: any[] = [token];
    const args: any = [2];

    await sendTx(functionId, tyArgs, args);
  }, [sendTx]);

  const testSHA3 = useCallback(() => {
    if (!account) return;

    // const sha3 = new SHA3(256);
    const aliceNum = 2;

    const secretBuf = Buffer.concat(
      [Buffer.from(account.slice(2), "hex"), Buffer.from([aliceNum])],
      17
    );
    const secret = Buffer.from(sha3_256(secretBuf), "hex");
    // sha3.update(secretBuf.toString());
    // const secret = sha3.digest();
    console.log({ secretBuf, secret });
  }, [account]);

  return (
    <div>
      <h3>RockGame</h3>
      <div>
        <button onClick={testSHA3}>testSHA3</button>
        <button onClick={aliceInitGame}>aliceInitGame</button>
        <button onClick={aliceGameInfo}>aliceGameInfo</button>
        <button onClick={bobWhat}>bobWhat</button>
        <button onClick={aliceWhat}>aliceWhat</button>
      </div>
    </div>
  );
}
