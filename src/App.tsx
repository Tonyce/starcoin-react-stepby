import React, { useCallback, useEffect, useState } from "react";
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

const { account } = utils;

function App() {
  let starcoinProvider = new providers.Web3Provider(
    (window as any).starcoin,
    "any"
  );
  starcoinProvider.on("network", (newNetwork, oldNetwork) => {
    // When a Provider makes its initial connection, it emits a "network"
    // event with a null oldNetwork along with the newNetwork. So, if the
    // oldNetwork exists, it represents a changing network
    console.log({ newNetwork, oldNetwork });
    if (oldNetwork) {
      console.log("reload");
      window.location.reload();
    }
  });
  // useEffect(() => {
  //   let starcoinProvider;

  //   try {
  //     // window.starcoin is injected by Starmask(chrome extension)
  //     if ((window as any).starcoin) {
  //       // We must specify the network as 'any' for starcoin to allow network changes
  //       starcoinProvider = new providers.Web3Provider(
  //         (window as any).starcoin,
  //         "any"
  //       );
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   console.log(starcoinProvider);
  // }, []);

  const [encryptPubKey, setEncryptPubkey] = useState("");

  const onClickConnect = async () => {
    try {
      // const newAccounts = await (window as any).starcoin.request({
      //   method: "stc_requestAccounts",
      // });
      // console.log(newAccounts);
      // handleNewAccounts(newAccounts)
      const network = await starcoinProvider.getNetwork();
      console.log(network);
      const result = await starcoinProvider.send("stc_requestAccounts", []);
      console.log(result);
      console.log(BigInt(10 ** 9));
      let balance = await starcoinProvider.getBalance(result[0]);
      if (balance)
        console.log(
          { balance },
          (BigInt(balance.valueOf()) / BigInt(10 ** 9)).toString()
        );
      const blockNumber = await starcoinProvider.getBlockNumber();
      console.log({ blockNumber });
    } catch (error) {
      console.error(error);
    }
  };

  const personalSign = async () => {
    const exampleMessage = "Example `personal_sign` message 中文";
    try {
      // personalSignResult.innerHTML = ''
      // personalSignVerify.disabled = false
      // personalSignRecoverResult.innerHTML = ''
      const result = await starcoinProvider.send("stc_requestAccounts", []);
      const from = result[0];
      const msg = `0x${Buffer.from(exampleMessage, "utf8").toString("hex")}`;
      // console.log({ msg })
      // const networkId = networkDiv.innerHTML
      const network = await starcoinProvider.getNetwork();
      console.log(network);
      const extraParams = { networkId: network.chainId };
      const sign = await (window as any).starcoin.request({
        method: "personal_sign",
        // params: [msg, from, 'Example password'],
        // extraParams = params[2] || {}; means it should be an object:
        // params: [msg, from, { pwd: 'Example password' }],
        params: [msg, from, extraParams],
      });
      console.log(sign);
      // personalSignResult.innerHTML = sign
    } catch (err) {
      console.error(err);
      // personalSign.innerHTML = `Error: ${ err.message }`
    }
  };

  const personalSignVerify = async () => {
    try {
      const accounts = await starcoinProvider.send("stc_requestAccounts", []);
      const from = accounts[0];
      const sign =
        "0x960a6948ca6a9e5fbcf77bdd43eb5c3c264578616d706c652060706572736f6e616c5f7369676e60206d65737361676520e4b8ade69687002000b2c70e4d2f08e8e38b32743f5f52549519739f23542f492f1a6f5fe03f94304027904b10119db51df6a745245d1fc152e6cbcb462ee5e50538342503cab794ad243bd90120f2e4f50427e5a008c3d49c45280e80ba7b94ca78b3375e3d5c630afb";
      const recoveredAddr =
        await utils.signedMessage.recoverSignedMessageAddress(sign);
      console.log({ recoveredAddr, from });

      // if (recoveredAddr === from) {
      //   console.log(
      //     `@starcoin/starcoin Successfully verified signer as ${recoveredAddr}`
      //   );
      //   personalSignRecoverResult.innerHTML = recoveredAddr;
      // } else {
      //   console.log("@starcoin/starcoin Failed to verify signer");
      // }
    } catch (err) {
      console.error(err);
      // personalSignRecoverResult.innerHTML = `Error: ${err.message}`;
    }
  };

  const getEncryptionKey = useCallback(async () => {
    try {
      const accounts = await starcoinProvider.send("stc_requestAccounts", []);
      const publicKey = await (window as any).starcoin.request({
        method: "stc_getEncryptionPublicKey",
        params: [accounts[0]],
      });
      console.log({ publicKey });
      setEncryptPubkey(publicKey);
      // encryptionKeyDisplay.innerText = publicKey
      // encryptMessageInput.disabled = false
    } catch (error) {
      // encryptionKeyDisplay.innerText = `Error: ${ error.message }`
      // encryptMessageInput.disabled = true
      // encryptButton.disabled = true
      // decryptButton.disabled = true
    }
  }, []);

  const encryptMsg = useCallback(() => {
    try {
      const ecrryptResult = encrypt(
        encryptPubKey,
        { "data": "hello starcoin" },
        "x25519-xsalsa20-poly1305"
      );
      const result = stringifiableToHex(ecrryptResult);
      console.log(result);
    } catch (error) {}
  }, [encryptPubKey]);

  const decryptMsg = async () => {
    try {
      const r = await (window as any).starcoin.request({
        method: "stc_decrypt",
        params: [
          "0x7b2276657273696f6e223a227832353531392d7873616c736132302d706f6c7931333035222c226e6f6e6365223a226357734163614265656a44324245414b5230706e3236347178647157346f582b222c22657068656d5075626c69634b6579223a22397646664f4c417772332f314c5a736138563771376f794e356c7361706c4b626f783061535950762b54493d222c2263697068657274657874223a226e597a49353634544b5664385a3336666c326250523035432b4e4f6668732b744b634e6d78545374227d",
          (window as any).starcoin.selectedAddress,
        ],
      });
      console.log(r);
    } catch (error) {
      // cleartextDisplay.innerText = `Error: ${ error.message }`
    }
  };

  const nodeUrlMap = {
    "1": "https://main-seed.starcoin.org",
    "251": "https://barnard-seed.starcoin.org",
    "252": "https://proxima-seed.starcoin.org",
    "253": "https://halley-seed.starcoin.org",
    "254": "http://localhost:9850",
  };
  const nft = {
    name: "test_nft",
    imageUrl: "https://arweave.net/QeSUFwff9xDbl4SCXlOmEn0TuS4vPg11r2_ETPPu_nk",
    description: "test nft desc",
  };
  const mintWithImageUrl = async () => {
    // nftResult.innerHTML = 'Calling mintWithImage'
    // mintWithImage.disabled = true
    try {
      const network = await starcoinProvider.getNetwork();
      console.log(network);
      // const extraParams = { networkId: network.chainId };

      const functionId =
        "0x2c5bd5fb513108d4557107e09c51656c::SimpleNFTScripts::mint_with_image";
      const tyArgs: any[] = [];
      const args = [nft.name, nft.imageUrl, nft.description];

      const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
      if (!nodeUrlMap[chainId]) return;

      const nodeUrl = nodeUrlMap[chainId];
      console.log({ functionId, tyArgs, args, nodeUrl });

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

      const transactionHash = await starcoinProvider
        .getSigner()
        .sendUncheckedTransaction(txParams);
      console.log({ transactionHash });
      // nftResult.innerHTML = 'Call mintWithImage Completed'
      // mintWithImage.disabled = false
    } catch (error) {
      // nftResult.innerHTML = 'Call mintWithImage Failed'
      // mintWithImage.disabled = false
      throw error;
    }
  };

  // 0xb80660f71e0d5ac2b5d5c43f2246403f
  // 0x0abC432999Ce06FF2CcD02f86eA898f1

  const sendSTC = async () => {
    // const sendAmount = parseFloat(
    //   document.getElementById("amountInput").value,
    //   10
    // );
    // if (!(sendAmount > 0)) {
    //   // eslint-disable-next-line no-alert
    //   window.alert("Invalid sendAmount: should be a number!");
    //   return false;
    // }
    // const BIG_NUMBER_NANO_STC_MULTIPLIER = new BigNumber('1000000000')
    // const sendAmountSTC = new BigNumber(String(document.getElementById('amountInput').value), 10)
    const sendAmountNanoSTC = BigInt(10 ** 9); // sendAmountSTC.times(BIG_NUMBER_NANO_STC_MULTIPLIER)
    const sendAmountHex = `0x${sendAmountNanoSTC.toString(16)}`;
    console.log({
      sendAmountHex,
      sendAmountNanoSTC: sendAmountNanoSTC.toString(10),
    });

    const txParams = {
      to: "0x0abC432999Ce06FF2CcD02f86eA898f1",
      value: sendAmountHex,
      gasLimit: 127845,
      gasPrice: 1,
      expiredSecs: 30,
    };

    // const expiredSecs = 30;
    // console.log({ expiredSecs })
    // if (expiredSecs > 0) {
    //   txParams.expiredSecs = expiredSecs
    // }

    console.log({ txParams });
    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log(transactionHash);
  };

  const initCounter = async () => {
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    // const extraParams = { networkId: network.chainId };

    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::MyCounter::init_counter";
    const tyArgs: any[] = [];
    const args: any = [];

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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const incrCounter = async () => {
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    // const extraParams = { networkId: network.chainId };

    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::MyCounter::incr_counter";
    const tyArgs: any[] = [];
    const args: any = [];

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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const getCounter = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const result = await (window as any).starcoin.request({
      method: "state.get_resource",
      params: [
        accounts[0],
        "0xb80660f71e0d5ac2b5d5c43f2246403f::MyCounter::Counter",
      ],
    });
    console.log(result);
    const data = new bcs.BcsDeserializer(arrayify(result.raw)).deserializeU64();
    console.log(data);
    console.log(
      new bcs.BcsDeserializer(
        arrayify("0xeb750400000000000000000000000000")
      ).deserializeU64()
    );
    // const d = utils.hex.toHexString(data);
    // console.log(d);
  };

  const initCounterStruct = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
    if (!nodeUrlMap[chainId]) return;
    const nodeUrl = nodeUrlMap[chainId];
    const token = "0x00000000000000000000000000000001::STC::STC";
    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV6::init_counter";
    const tyArgs: any[] = [token];
    const args: any = [];
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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const strChange = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
    if (!nodeUrlMap[chainId]) return;
    const nodeUrl = nodeUrlMap[chainId];

    const randomString =
      Math.random().toString() + "-" + Math.random().toString();
    console.log({ randomString });
    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV3::change_name";
    const tyArgs: any[] = [];
    const args: any = [randomString];
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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const getCounterStruct = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const data = await starcoinProvider.getResource(
      accounts[0],
      `0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV6::Counter`
    );
    console.log(data);
    const result = await (window as any).starcoin.request({
      method: "state.get_resource",
      params: [
        accounts[0],
        "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV6::Counter",
      ],
    });
    console.log(result);
    // const data = new bcs.BcsDeserializer(
    //   arrayify(result.raw)
    // ).de();
    const de = new bcs.BcsDeserializer(arrayify(result.raw));
    const name = de.deserializeStr();
    const value = de.deserializeU8();
    const timestamp = de.deserializeU64();
    const input = Number(timestamp);
    console.log(name, input);
    console.log({
      name: Buffer.from(name).toString(),
      value,
      timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
    });
  };

  const sha3WithNum = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);

    const randomNum = 102301412; //Math.floor(Math.random() * 1_000_000);

    console.log("randomNum", randomNum, randomNum % 3);
    const secreteNum = BigInt(accounts[0]) + BigInt(randomNum);
    console.log(accounts, secreteNum);
    const sha3 = new SHA3(256);
    sha3.update(secreteNum.toString());
    console.log(sha3.digest("hex"));
  };

  const initRockPaperScissorsGame = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
    if (!nodeUrlMap[chainId]) return;
    const nodeUrl = nodeUrlMap[chainId];

    const sha3 = new SHA3(256);
    // const randomNum = Math.floor(Math.random() * 10_000);
    const aliceNum = 2;

    // console.log("randomNum", randomNum, randomNum % 3);
    const secreteNum = BigInt(accounts[0]) + BigInt(aliceNum);
    console.log(accounts, secreteNum);

    sha3.update(secreteNum.toString());
    const secret = sha3.digest("hex");
    console.log({ secret });

    const token = "0x00000000000000000000000000000001::STC::STC";
    const amount = 0.1 * 1000_000_000;
    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV12::init_game";
    const tyArgs: any[] = [token];
    const args: any = [secret, amount];
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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const getRockPaperScissorsGame = async () => {
    const token = "0x00000000000000000000000000000001::STC::STC";
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const data = await starcoinProvider.getResource(
      accounts[0],
      `0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV12::Game`
    );
    console.log(data);
    // const result = await (window as any).starcoin.request({
    //   method: "state.get_resource",
    //   params: [
    //     accounts[0],
    //     `0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV12::Game`,
    //   ],
    // });
    // console.log({ result });
    // if (!result) return;
    // // const data = new bcs.BcsDeserializer(
    // //   arrayify(result.raw)
    // // ).de();
    // const de = new bcs.BcsDeserializer(arrayify(result.raw));
    // const aliceSecretNum = de.deserializeBytes();
    // const bobNum = de.deserializeU8();
    // const aliceNum = de.deserializeU64();
    // const timestamp = de.deserializeU64();
    // const arbiter = de.deserializeU128();
    // console.log({
    //   aliceSecretNum: Buffer.from(aliceSecretNum).toString("hex"),
    //   bobNum,
    //   aliceNum,
    //   timestamp,
    //   arbiter,
    // });
    // const input = Number(timestamp);
    // console.log(name, input);
    // console.log({
    //   name: Buffer.from(name).toString(),
    //   value,
    //   timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
    // });
  };

  const bobWhat = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
    if (!nodeUrlMap[chainId]) return;
    const nodeUrl = nodeUrlMap[chainId];

    const token = "0x00000000000000000000000000000001::STC::STC";
    const amount = 0.1 * 1000_000_000;
    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV12::bob_what";
    const tyArgs: any[] = [token];
    const args: any = ["0x0abC432999Ce06FF2CcD02f86eA898f1", 2, amount];
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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const aliceWhat = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
    if (!nodeUrlMap[chainId]) return;
    const nodeUrl = nodeUrlMap[chainId];

    const token = "0x00000000000000000000000000000001::STC::STC";
    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV12::alice_what";
    const tyArgs: any[] = [token];
    const args: any = [1];
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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  const aliceWinToken = async () => {
    const accounts = await starcoinProvider.send("stc_requestAccounts", []);
    console.log(accounts);
    const network = await starcoinProvider.getNetwork();
    console.log(network);
    const chainId = `${network.chainId}` as keyof typeof nodeUrlMap;
    if (!nodeUrlMap[chainId]) return;
    const nodeUrl = nodeUrlMap[chainId];
    const token = "0x00000000000000000000000000000001::STC::STC";
    const functionId =
      "0xb80660f71e0d5ac2b5d5c43f2246403f::RockPaperScissorsV12::win_token";
    const tyArgs: any[] = [token];
    const args: any = [];
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

    const transactionHash = await starcoinProvider
      .getSigner()
      .sendUncheckedTransaction(txParams);
    console.log({ transactionHash });
  };

  return (
    <div className="App">
      <div>
        <button onClick={onClickConnect}>onClickConnect</button>
        <button onClick={personalSign}>personalSign</button>
        <button onClick={personalSignVerify}>personalSignVerify</button>
        <button onClick={getEncryptionKey}>getEncryptionKey</button>
        <button onClick={encryptMsg}>encryptMsg</button>
        <button onClick={decryptMsg}>decryptMsg</button>
        <button onClick={mintWithImageUrl}>mintNft</button>
        <button onClick={sendSTC}>sendSTC</button>

        <button onClick={initCounter}>initCounter</button>
        <button onClick={getCounter}>getCounter</button>
        <button onClick={incrCounter}>incrCounter</button>
      </div>
      <div>
        <button onClick={initCounterStruct}>initCounterStruct</button>
        <button onClick={strChange}>strChange</button>
        <button onClick={getCounterStruct}>getCounterStruct</button>
      </div>
      <div>
        <button onClick={sha3WithNum}>sha3WithNum</button>
      </div>
      <div>
        <button onClick={initRockPaperScissorsGame}>
          initRockPaperScissorsGame
        </button>
        <button onClick={getRockPaperScissorsGame}>
          getRockPaperScissorsGame
        </button>
        <button onClick={bobWhat}>bobWhat</button>
        <button onClick={aliceWhat}>aliceWhat</button>
        <button onClick={aliceWinToken}>aliceWinToken</button>
      </div>
    </div>
  );
}

export default App;

function stringifiableToHex(value: EthEncryptedData) {
  return hexlify(Buffer.from(JSON.stringify(value)));
}
