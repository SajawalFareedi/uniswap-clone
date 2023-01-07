const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let sendValue = ethers.utils.parseEther("0.1")
          let mockV3Aggregator
          let deployer
          let fundMe

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("construtor", () => {
              it("should set the aggregator address correctly", async () => {
                  const deployedPriceFeedAddress = await fundMe.priceFeed()
                  assert.equal(
                      deployedPriceFeedAddress,
                      mockV3Aggregator.address
                  )
              })
          })

          describe("fund", () => {
              it("should get reverted if sent ETH is not enough", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Not enough eth!"
                  )
              })
              it("should add funder to funders array", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.funders(0)
                  assert.equal(funder, deployer)
              })
              it("should add the funder amount in mapping", async () => {
                  await fundMe.fund({ value: sendValue })
                  const fundedValue = await fundMe.addressToAmountFunded(
                      deployer
                  )
                  assert.equal(fundedValue.toString(), sendValue.toString())
              })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("should revert if attacker tries to withdraw funds", async () => {
                  const signers = await ethers.getSigners()
                  await fundMe.connect(signers[1])
                  await expect(fundMe.withdraw()).to.be.revertedWith(
                      "FundMe__NotOwner"
                  )
              })

              it("should update the data of funders correctly", async () => {
                  const signers = ethers.getSigners()

                  for (let i = 1; i < signers.length; i++) {
                      const signer = signers[i]
                      await fundMe.connect(signer)
                      await fundMe.fund({ value: sendValue })
                  }

                  const initContractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const initDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const withdrawGasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      initContractBalance.add(initDeployerBalance).toString(),
                      endingDeployerBalance.add(withdrawGasCost).toString()
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
