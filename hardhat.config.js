require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("hardhat-deploy")
require("solidity-coverage")
require("dotenv").config()

const ETHERSCAN_API = process.env.ETHERSCAN_API || ""
const COINMARKETCAP_API = process.env.COINMARKETCAP_API || ""
const GOERLI_ALCHEMY_URL = process.env.GOERLI_ALCHEMY_URL || ""
const MAIN_WALLET_PRIVATE_KEY = process.env.MAIN_WALLET_PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [{ version: "0.8.7" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: GOERLI_ALCHEMY_URL,
            accounts: [MAIN_WALLET_PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8575",
            chainId: 31337,
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API,
        outputFile: "gas-reports.txt",
        noColors: true,
    },
    etherscan: {
        apiKey: ETHERSCAN_API,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
}
