import React, { useEffect } from "react";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sleep } from "@/lib/utils";
import { Types } from "aptos";

type Gift = {
  address: String;
  amount: number;
  timestamp: number;
};

/*
  List of gifts that the user has sent to others.
*/
export default function SentGiftList(
  props: {
    isTxnInProgress: boolean;
    setTxn: (isTxnInProgress: boolean) => void;
  }
) {
  // Wallet adapter state
  const { account, connected, signAndSubmitTransaction } = useWallet();
  // Gift list state
  const [gifts, setGifts] = React.useState<Gift[]>([]);

  /* 
    Retrieves the gifts sent by the user whenever the account, connected, or isTxnInProgress state 
    changes.
  */
  useEffect(() => {
    if (connected) {
      getGifts().then((gifts) => {
        setGifts(gifts);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /* 
    Retrieves the gifts sent by the user.
  */
  const getGifts = async () => {
    /*
      TODO #2: Validate the account is defined before continuing. If not, return.
    */
    if (!account) return [];

    /*
      TODO #3: Make a request to the view function `view_gifters_gifts` to retrieve the gifts sent by 
            the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::view_gifters_gifts`,
      type_arguments: [],
      arguments: [account.address],
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
      console.log(e);
      return [];
    }

    /* 
      TODO #4: Parse the response from the view request and create the gifts array using the given 
            data. Return the new gifts array.

      HINT:
        - Remember to convert the amount to floating point number
    */
    const data = await res.json();
    const totalGifts = data[0].length;

    let gifts: Gift[] = [];
    for (let idx = 0; idx < totalGifts; idx++) {
      gifts.push({
        address: data[0][idx],
        timestamp: parseInt(data[2][idx]),
        amount: parseInt(data[1][idx]) / Math.pow(10, 8)
      })
    }

    return gifts;
  };

  /*
    Cancels a gift sent by the user.
  */
  const cancelGift = async (recipientAddress: String) => {
    /* 
      TODO #6: Set the `isTxnInProgress` state to true.
    */
    props.setTxn(true);

    /* 
      TODO #7: Submit a transaction to the `remove_birthday_gift` entry function to cancel the gift
            for the recipient.
      
      HINT:
        - In case of error, set the `isTxnInProgress` state to false and return.
    */
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload", // The type of transaction payload
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::remove_birthday_gift`, // The address::module::function to call
      type_arguments: [],
      arguments: [
        recipientAddress
      ],
    };

    try {
      const result = await signAndSubmitTransaction(payload);
      await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))
      console.log(result);
    } catch (e) {
      console.log(e);
      props.setTxn(false);
      return;
    }

    /*
      TODO #8: Set the `isTxnInProgress` state to false.
    */
    props.setTxn(false);

  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <CardTitle className="my-2">Gifts sent from you</CardTitle>
        <CardDescription className="break-normal w-96">
          View all of the unclaimed gifts you have sent to others. You can cancel any of these gifts
          at any time and the APT will be returned to your wallet.
        </CardDescription>
      </div>
      <ScrollArea className="border rounded-lg">
        <div className="h-fit max-h-56">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Recipient</TableHead>
                <TableHead className="text-center">Birthday</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Cancel gift</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                gifts.length == 0 &&
                <TableRow>
                  <TableCell colSpan={4}>
                    <p className="break-normal w-80 text-center">
                      You don't have any active gifts. Send a gift to someone to get started!
                    </p>
                  </TableCell>
                </TableRow>
              }
              {
                gifts.map((gift, index) =>
                  <TableRow key={index}>
                    <TableCell className="font-mono">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {gift.address.slice(0, 6)}...{gift.address.slice(-4)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {gift.address}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {
                              new Date(gift.timestamp * 1000).toLocaleDateString()
                            }
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {
                                new Date(gift.timestamp * 1000).toString()
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {gift.amount.toFixed(2)} APT
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {gift.amount.toFixed(8)} APT
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel the gift for{" "}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="underline">
                                    {gift.address.slice(0, 6)}...{gift.address.slice(-4)}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {gift.address}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider> and return the{" "}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="underline">
                                    {gift.amount.toFixed(2)}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {gift.amount.toFixed(8)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider> APT to your wallet.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Nevermind</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelGift(gift.address)}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              }
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
