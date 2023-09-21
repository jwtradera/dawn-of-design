"use client";

import { WalletReadyState, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

/* 
  Component that displays a button to connect a wallet. If the wallet is connected, it displays the 
  wallet's APT balance, address and a button to disconnect the wallet. 

  When the connect button is clicked, a dialog is displayed with a list of all supported wallets. If 
  a supported wallet is installed, the user can click the connect button to connect the wallet. If
  the wallet is not installed, the user can click the install button to install the wallet.
*/
export default function WalletSelector(
  props: {
    isTxnInProgress?: boolean;
  }
) {

  // wallet state variables 
  const { connect, account, connected, disconnect, wallets, isLoading } = useWallet();
  // State to hold the current account's APT balance. In string - floating point format.
  const [balance, setBalance] = useState<string | undefined>(undefined);

  /* 
    Gets the balance of the connected account whenever the connected, account, and isTxnInProgress
    variables change.
  */
  useEffect(() => {
    if (connected && account) {
      getBalance(account.address);
    }
  }, [connected, account, props.isTxnInProgress]);

  /*
    Gets the balance of the given address. In case of an error, the balance is set to 0. The balance
    is returned in floating point format.
    @param address - The address to get the APT balance of.
  */
  const getBalance = async (address: string) => {
    /* 

      TODO #3: Make a call to the 0x1::coin::balance function to get the balance of the given address. 
      
      HINT: 
        - The APT balance is return with a certain number of decimal places. Remember to convert the 
          balance to floating point format as a string.
        - Remember to make the API request in a try/catch block. If there is an error, set the 
          balance to "0".

    */
    const body = {
      function:
        "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    };

    let res;
    try {
      res = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/view`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
    } catch (e) {
      setBalance("0");
      return;
    }

    const data = await res.json();
    if (data.error_code) {
      setBalance("0");
    }
    else {
      setBalance((data / 100000000).toLocaleString());
    }

  };

  return (
    <div>
      {!connected && !isLoading && (
        <Dialog>
          <DialogTrigger asChild>
            <Button>Connect Wallet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect your wallet</DialogTitle>
              {
                wallets.map((wallet) =>
                  <div key={wallet.name}
                    className="flex w-fulls items-center justify-between rounded-xl p-2"
                  >
                    <h1>{wallet.name}</h1>
                    {
                      wallet.readyState === WalletReadyState.Installed &&
                      <Button variant="secondary" onClick={() => connect(wallet.name)}>
                        Connect
                      </Button>
                    }
                    {
                      wallet.readyState === WalletReadyState.NotDetected &&
                      <a href={wallet.url} target="_blank">
                        <Button variant="secondary">
                          Install
                        </Button>
                      </a>
                    }
                  </div>
                )
              }
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      }
      {
        isLoading && <Button variant="secondary" disabled>
          Loading...
        </Button>
      }
      {
        connected && account &&
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="font-mono">
                {balance} APT | {account.address.slice(0, 5)}...{account.address.slice(-4)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => disconnect()}>
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    </div >
  );
}
