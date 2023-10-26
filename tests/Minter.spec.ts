import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, beginCell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { describe } from 'node:test';
import { JettonWallet } from "../wrappers/JettonWallet";

describe('Minter & Wallet tests', () => {

    let minterCode: Cell;
    let walletCode: Cell;

    beforeAll(async () => {

        minterCode = await compile('Minter');
        walletCode = await compile('JettonWallet');
        
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;
    let adminJettonWallet: SandboxContract<JettonWallet>;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let newAdmin: SandboxContract<TreasuryContract>;
    let transferAdmin: SandboxContract<TreasuryContract>;
    let manager: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let userJettonWallet: SandboxContract<JettonWallet>;
    let userSecond: SandboxContract<TreasuryContract>;
    let userSecondJettonWallet: SandboxContract<JettonWallet>;

    beforeEach(async () => {

        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        newAdmin = await blockchain.treasury('newAdmin');
        transferAdmin = await blockchain.treasury('transferAdmin');
        manager = await blockchain.treasury('manager');
        user = await blockchain.treasury('user');
        userSecond = await blockchain.treasury('userSecond');

        minter = blockchain.openContract(Minter.createFromConfig({

                totalSupply: toNano(700000000),
                adminAddress: admin.address,
                transferAdminAddress: transferAdmin.address,
                managerAddress: manager.address,
                jettonWalletCode: walletCode

            }, minterCode
        ));

        const stableMinterDeployResult = await minter.sendDeploy(deployer.getSender(), toNano(0.0777));

        adminJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await minter.getWalletAddress(admin.address)));
        userJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await minter.getWalletAddress(user.address)));
        userSecondJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await minter.getWalletAddress(userSecond.address)));

        const jettonData = await minter.getJettonData();

        expect(jettonData.totalSupply).toBe(toNano(700000000));
        expect(jettonData.flag).toBe(Number(-1));
        expect(jettonData.adminAddress).toEqualAddress(admin.address);

        const jettonManager = await minter.getJettonManager();

        expect(jettonManager).toEqualAddress(manager.address);

        expect(stableMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });

        const mintStablesToAdmin = await minter.sendMint(
            
            admin.getSender(), 
            toNano(0.1), 
            toNano(0.05), 
            admin.address, 
            toNano(300000000)

        );

        expect(mintStablesToAdmin.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true
        });

        expect(mintStablesToAdmin.transactions).toHaveTransaction({
            from: minter.address,
            to: adminJettonWallet.address,
            success: true
        });

        expect(await adminJettonWallet.getJettonBalance()).toBe(toNano(300000000));
        expect((await minter.getJettonData()).totalSupply).toBe(toNano(1000000000));

    });

    it('minter should provide wallet address', async () => {

        const sendProvideWalletAddressResultWithIncludedAddress = await minter.sendProvideWalletAddress(admin.getSender(), toNano(0.1), admin.address, 1);

        expect(sendProvideWalletAddressResultWithIncludedAddress.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true,
            op: 0x2c76b973
        });

        expect(sendProvideWalletAddressResultWithIncludedAddress.transactions).toHaveTransaction({
            from: minter.address,
            to: admin.address,
            success: true,
            op: 0xd1735400,
            body: 
                beginCell()
                    .storeUint(0xd1735400, 32)
                    .storeUint(0, 64)
                    .storeAddress(adminJettonWallet.address)
                    .storeMaybeRef(
                        beginCell()
                            .storeAddress(admin.address)
                        .endCell()
                    )
                .endCell()
        });

        const sendProvideWalletAddressResult = await minter.sendProvideWalletAddress(admin.getSender(), toNano(0.1), admin.address, 0);

        expect(sendProvideWalletAddressResult.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true,
            op: 0x2c76b973
        });

        expect(sendProvideWalletAddressResult.transactions).toHaveTransaction({
            from: minter.address,
            to: admin.address,
            success: true,
            op: 0xd1735400,
            body: 
                beginCell()
                    .storeUint(0xd1735400, 32)
                    .storeUint(0, 64)
                    .storeAddress(adminJettonWallet.address)
                    .storeMaybeRef()
                .endCell()
        });

    });

    it('minter should change admin', async () => {

        const addTransferAdminResult = await minter.sendChangeAdmin(admin.getSender(), toNano(0.1), newAdmin.address);

        expect(addTransferAdminResult.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true,
            op: 3
        });

        const claimAdminResult = await minter.sendClaimAdmin(newAdmin.getSender(), toNano(0.1));

        expect(claimAdminResult.transactions).toHaveTransaction({
            from: newAdmin.address,
            to: minter.address,
            success: true,
            op: 4
        });

        expect((await minter.getJettonData()).adminAddress).toEqualAddress(newAdmin.address);

    });


    it('minter should change manager', async () => {

        const changeManager = await minter.sendChangeManager(admin.getSender(), toNano(0.1), newAdmin.address);

        expect(changeManager.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true,
            op: 7
        });

        const jettonManager = await minter.getJettonManager();

        expect(jettonManager).toEqualAddress(newAdmin.address);

    });

    it('minter should call to', async () => {

        const mintStablesToUser = await minter.sendMint(
            
            admin.getSender(), 
            toNano(0.1), 
            toNano(0.05), 
            user.address, 
            toNano(7777)

        );

        expect(mintStablesToUser.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true
        });

        expect(mintStablesToUser.transactions).toHaveTransaction({
            from: minter.address,
            to: userJettonWallet.address,
            success: true
        });

        expect(await userJettonWallet.getJettonBalance()).toBe(toNano(7777));
        expect((await minter.getJettonData()).totalSupply).toBe(toNano(1000000000 + 7777));

        const callToTransferResult = await minter.sendCallToTransfer(

            admin.getSender(), 
            toNano(0.1), 
            user.address,
            toNano(0.1),
            toNano(777),
            userSecond.address,
            user.address,
            beginCell().endCell(),
            toNano(0.05),
            BigInt(-1),
            beginCell().endCell()

        );

        expect(callToTransferResult.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true
        });

        expect(callToTransferResult.transactions).toHaveTransaction({
            from: minter.address,
            to: userJettonWallet.address,
            success: true
        });

        expect(callToTransferResult.transactions).toHaveTransaction({
            from: userJettonWallet.address,
            to: userSecondJettonWallet.address,
            success: true
        });

        expect(await userJettonWallet.getJettonBalance()).toBe(toNano(7777 - 777));
        expect(await userSecondJettonWallet.getJettonBalance()).toBe(toNano(777));

        const callToBurnResult = await minter.sendCallToBurn(

            admin.getSender(), 
            toNano(0.1), 
            user.address,
            toNano(0.1),
            toNano(1000),
            userSecond.address

        );

        expect(callToBurnResult.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true
        });

        expect(callToBurnResult.transactions).toHaveTransaction({
            from: minter.address,
            to: userJettonWallet.address,
            success: true
        });

        expect(await userJettonWallet.getJettonBalance()).toBe(toNano(6000));

        const callToGetStatus = await minter.sendCallToSetStatus(

            admin.getSender(), 
            toNano(0.1), 
            user.address,
            toNano(0.1),
            BigInt(1)

        );

        expect(callToGetStatus.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true
        });

        expect(callToGetStatus.transactions).toHaveTransaction({
            from: minter.address,
            to: userJettonWallet.address,
            success: true
        });

        expect(await userJettonWallet.getStatus()).toBe(BigInt(1));

        const sendStablesResult = await userJettonWallet.sendTransfer(

            user.getSender(),
            toNano(0.1),
            toNano(0.1),
            beginCell().endCell(),
            userSecond.address,
            toNano(1000)

        );

        expect(sendStablesResult.transactions).toHaveTransaction({
            from: user.address,
            to: userJettonWallet.address,
            success: false,
            exitCode: 45
        });

        expect(sendStablesResult.transactions).toHaveTransaction({
            from: userJettonWallet.address,
            to: user.address,
            success: true
        });

    });

    it('wallet should transfer & recieve tokens', async () => {

        const sendStablesResult = await adminJettonWallet.sendTransfer(

            admin.getSender(),
            toNano(0.1),
            toNano(0.1),
            beginCell().endCell(),
            user.address,
            toNano(1000)

        );

        expect(sendStablesResult.transactions).toHaveTransaction({
            from: admin.address,
            to: adminJettonWallet.address,
            success: true
        });

        expect(sendStablesResult.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: userJettonWallet.address,
            success: true
        });

        expect(await adminJettonWallet.getJettonBalance()).toBe(toNano(300000000 - 1000));
        expect(await userJettonWallet.getJettonBalance()).toBe(toNano(1000));

    });

    it('wallet should burn tokens', async () => {

        const burnAdminStables = await adminJettonWallet.sendBurn(

            admin.getSender(), 
            admin.address,
            toNano(0.1),
            toNano(1000)

        );

        expect(burnAdminStables.transactions).toHaveTransaction({
            from: admin.address,
            to: adminJettonWallet.address,
            success: true
        });

        expect(burnAdminStables.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: minter.address,
            success: true
        });

        expect(await adminJettonWallet.getJettonBalance()).toBe(toNano(300000000 - 1000));

        const jettonData = await minter.getJettonData();

        expect(jettonData.totalSupply).toBe(toNano(1000000000 - 1000));

    });

    it('should get wallet data', async () => {

        const walletData = await adminJettonWallet.getWalletData();

        expect(walletData.balance).toBe(toNano(300000000));
        expect(walletData.ownerAddress).toEqualAddress(admin.address);
        expect(walletData.jettonMasterAddress).toEqualAddress(minter.address);
        expect(walletData.jettonWalletCode).toEqualCell(walletCode);

    });

});
