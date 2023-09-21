
import React, { useEffect } from "react";
import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Types } from "aptos";
import { sleep } from "@/lib/utils";

type RecipientGifts = {
  from: string;
  amount: number;
  timestamp: number;
};

/* 
  Lists all of the user's received gifts. Allows the user to claim gifts whose release time has 
  passed.
*/
export default function ReceivedGiftList(
  props: {
    isTxnInProgress: boolean;
    setTxn: (isTxnInProgress: boolean) => void;
  }
) {
  // Lists of gifts sent to the user
  const [gifts, setGifts] = React.useState<RecipientGifts[]>([]);
  // State for the wallet
  const { account, connected, signAndSubmitTransaction } = useWallet();

  /* 
    Get's the gifts sent to the user when the account, connected, or isTxnInProgress state 
    variables change. 
  */
  useEffect(() => {
    if (connected) {
      getGifts().then((gifts) => {
        setGifts(gifts);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /* 
    Gets the gifts sent to the user.
  */
  const getGifts = async () => {
    /*
      TODO #2: Validate the account is defined before continuing. If not, return.
    */
    if (!account) return [];

    /* 
      TODO #3: Make a view function call to the view_recipients_gifts function in the birthday_bot 
            module to get the gifts sent to the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::view_recipients_gifts`,
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
      TODO #4: Take the response from the view request and parse it into a list of gifts. The gifts 
            should then be sorted by their release time in ascending order. Return the sorted list
            of gifts. 

      HINT:
        - Remember to convert the amount to floating point format
    */
    const data = await res.json();
    const totalGifts = data[0].length;

    let gifts: RecipientGifts[] = [];
    for (let idx = 0; idx < totalGifts; idx++) {
      gifts.push({
        from: data[0][idx],
        timestamp: parseInt(data[2][idx]),
        amount: parseInt(data[1][idx]) / Math.pow(10, 8)
      })
    }

    gifts.sort((a: RecipientGifts, b: RecipientGifts) => {
      return a.timestamp - b.timestamp;
    })

    return gifts;
  };

  /* 
    Claims a gift sent to the user.
  */
  const claimGift = async (giftSender: string) => {
    /* 
      TODO #6: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);

    /*
      TODO #7: Submit a transactions to the claim_birthday_gift function in the birthday_bot module to 
      claim the gift sent from the `giftSender` address.

      HINT: 
        - Use a try/catch block to catch any errors that may occur. In the case of an error, set the
          isTxnInProgress prop to false and return.
    */
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload", // The type of transaction payload
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::claim_birthday_gift`, // The address::module::function to call
      type_arguments: [],
      arguments: [
        giftSender
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
        <CardTitle className="my-2">Gifts sent to you!</CardTitle>
        <CardDescription className="break-normal w-96">
          View and open all of your gifts! You can only open gifts after the
          release time has passed. Spend your gifts on something nice!
        </CardDescription>
      </div>
      <ScrollArea className="border rounded-lg">
        <div className="h-fit max-h-56">
          <Table >
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">From</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Release time</TableHead>
                <TableHead className="text-center">Claim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                gifts.length == 0 &&
                <TableRow>
                  <TableCell colSpan={4}>
                    <p className="break-normal w-80 text-center">
                      You have no gifts yet. Send some gifts to your friends for their birthdays!
                    </p>
                  </TableCell>
                </TableRow>
              }
              {
                gifts.map((gift, index) =>
                  <TableRow key={index}>
                    <TableCell className="font-mono text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {gift.from.slice(0, 6)}...{gift.from.slice(-4)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {gift.from}
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
                                new Date(gift.timestamp * 1000).toLocaleString()
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => claimGift(gift.from)}
                        disabled={props.isTxnInProgress}
                      >
                        Claim
                      </Button>
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
