# TON-STABLE

FunC smart contracts for Stable Jetton on TON (for instance equivalent of US Dollar) issued by central entity.

## Contract audit
This is a fork of the contract with modifications described below.
Original contract was [audited by Certik](https://www.certik.com/projects/the-open-network?utm_source=CoinGecko&utm_campaign=AuditByCertiKLink) and all findings have been addressed. 

# Targets and goals

This project was created to allow users to exchange and buy assets in the TON DeFi ecosystem for a jetton (token or currency) that is not subject to volatile fluctuations. To meet regulatory requirements, the issuer of the tokens must have additional control over the tokens.

Thus this jetton represents a [standard TON jetton smart contracts](https://github.com/ton-blockchain/token-contract/tree/369ae089255edbd807eb499792a0a838c2e1b272/ft) with additional functionality:

- Added Manager role for external contract

- Admin can change Manager address

- Admin of jetton or Manager can make transfers from user's jetton wallet.

- Admin of jetton or Manager can burn user's jettons.

- Admin of jetton or Manager can lock/unlock user's jetton wallet (`set_status`). If the status is not set to zero, then the user's wallet is locked, the user cannot make transfers; Admin or Manager can make transfer even if wallet locked.

- Admin of jetton can change jetton-minter code and it's full data.

__It is critically important for issuer to carefully manage the admin's account private key to avoid any potential risks of being hacked. It is highly recommend to use multi-signature wallet as admin account with private keys stored on different air-gapped hosts / hardware wallets.__

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`

## Credits

Author @dariotarantini.

Reviewed by @tolya-yanot.

Upgraded by @maxtrl.

Deploy scripts & tests by @somewallet.
