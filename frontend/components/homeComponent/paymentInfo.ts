import { PaymentDetails, ProductDetails, PaymentOption } from "@superfluid-finance/widget";

export const paymentOptions: PaymentOption[] = [
   // Tier 1
  {
    chainId: 42220,
    receiverAddress: "0x1dF2013adCadFab51D7233547c78331f23B03e04",
    superToken: {
      address: "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a", // goodDollar, G$
    },
    flowRate: {
      amountEther: "1", // 1 Celo != 1 goodDollar
      period: "year",
    },
  },
  {
    chainId: 42220,
    receiverAddress: "0x7Dc01c36d8fd3e8104f818091D90F74710AEac2f",
    superToken: {
      address: "0x671425ae1f272bc6f79bec3ed5c4b00e9c628240", // superCelo(CELOx)
    },
    flowRate: {
      amountEther: "1", // 42 Celo != 42 goodDollar
      period: "year",
    },
  },
  // Tier 42
  {
    chainId: 42220,
    receiverAddress: "0x1dF2013adCadFab51D7233547c78331f23B03e04",
    superToken: {
      address: "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a", // goodDollar, G$
    },
    flowRate: {
      amountEther: "42", // 42 Celo != 42 goodDollar
      period: "year",
    },
  },
  {
    chainId: 42220,
    receiverAddress: "0x7Dc01c36d8fd3e8104f818091D90F74710AEac2f",
    superToken: {
      address: "0x671425ae1f272bc6f79bec3ed5c4b00e9c628240", // superCelo(CELOx)
    },
    flowRate: {
      amountEther: "42", // 42 Celo != 42 goodDollar
      period: "year",
    },
  },
];
export const paymentDetails: PaymentDetails = {
  paymentOptions,
};

export const productDetails: ProductDetails = {
  name: "Subscription Bound Account",
  description:
    "Subscription Bound Account is a subscription-based service that creates accounts bound to a subscription.",
  imageURI: "sba.png"
};
