import {useEffect, useState, useCallback} from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import {loadContracts} from "./utils/load-contracts";

const App = () => {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  });

  const [balance, setBalance] = useState(null);
  const [account, setAccount] = useState(null);
  const [shuldReload, reload] = useState(false);

  const canConnectToContract = account && web3Api.contract;
  const reloadEffect = useCallback(() => reload(!shuldReload), [shuldReload]);
  const setAccountListener = provider => {
    //provider.on("accountChanged", _ => window.location.reload());
    //provider.on("chainChanged ", _ => window.location.reload());
    provider.on("accountsChanged", accounts => setAccount(accounts[0]));
    provider._jsonRpcConnection.events.on("notificatin", payload => {
      const {method} = payload;
      if(method === "metamak_unlockStateChanged") {
        setAccount(null);
      }
    })
  };

  useEffect(() => {
    const loadProvider = async () => {
      let provider = await detectEthereumProvider();
      const contract = await loadContracts("Faucet", provider );

      if(provider) {
        setAccountListener(provider);
        setWeb3Api({
          web3: new Web3(provider),
          isProviderLoaded: true,
          provider,
          contract
        });
      } else {
        setWeb3Api(api => ({...api, isProviderLoaded: true}));
        console.error("Install metamask");
      }
    }

    loadProvider();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      const {contract, web3} = web3Api;
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, "ether"));
    }  

    web3Api.contract && loadBalance();
  }, [web3Api, shuldReload]);

  useEffect(() => {
    const getAccounts = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    }

    web3Api.web3 && getAccounts();
  }, [web3Api.web3]);

  const addFunds = useCallback(async () => {
    const {contract, web3} = web3Api;
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether")
    });
    reloadEffect();
  }, [account, web3Api, reloadEffect]);

  const withDrawFunds = async () => {
    const {contract, web3} = web3Api;
    const withdrawAmount = web3.utils.toWei("0.1", "ether");
    await contract.withdraw(withdrawAmount, {
      from: account
    });
    reloadEffect();
  }

  return <>
    <div className="faucet-wrapper">
      <div className="faucet">
        {web3Api.isProviderLoaded ?
          <div className="is-flex is-align-items-center">
            <span className="mr-2">
              <strong>Account:</strong>
            </span>
            {account ? 
              <span>{account}</span> : 
              !web3Api.provider ? 
                <>
                  <div className="notification is-warning is-size-6 is-counded">
                    Wallet is not detected! 
                    <a className="ml-2" target="_blank" rel="noreferrer" href="https:// docs.metamask.io">
                      Install Metamask
                    </a>
                  </div>
                </> :
                <button 
                  className="button is-info"
                  onClick={() => web3Api.provider.request({method: "eth_requestAccounts"})}
                >
                  Connect Wallet
                </button>
            }
          </div> :
          <span>Looking for a web3...</span>
        }
        <div className="ballance-view is-size-2 my-4">
           Current ballance <strong>{balance}</strong> EHT
        </div>
        {!canConnectToContract &&
          <i className="is-block ">Connect to Ganache</i>
        }
        <button 
          className="button is-link mr-2" 
          onClick={addFunds} 
          disabled={!canConnectToContract}>Donate 1 eth</button>
        <button 
          className="button is-primary" 
          onClick={withDrawFunds} 
          disabled={!canConnectToContract}>Withdraw 0.1 eth</button>
      </div>
    </div>
  </>
}

export default App;
