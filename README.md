# BlockRockPaperScissors

A decentralized Rock Paper Scissors game built on Ethereum blockchain with a Rails backend and React frontend.

## Tech Stack

- **Ruby**: 3.4.7
- **Rails**: 8.0.3
- **Frontend**: React 18.2.0 with TypeScript
- **Blockchain**: Solidity 0.8.20, Hardhat, ethers.js 6.13.5
- **Styling**: Tailwind CSS 4.0
- **Network**: Ethereum Sepolia Testnet

## Prerequisites

- **rbenv** (for Ruby version management)
- **Node.js** and **npm**
- **Git**
- **Infura API key** (for Ethereum network access)
- **Sepolia testnet private key** (for contract deployment)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nmdc00/BlockRockPaperScissors.git
cd BlockRockPaperScissors
```

### 2. Install Ruby 3.4.7

```bash
rbenv install 3.4.7
```

### 3. Install Dependencies

```bash
# Install Ruby gems
bundle install

# Install Node.js packages
npm install

# Install Hardhat dependencies
cd hardhat
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the `hardhat` directory:

```bash
cd hardhat
touch .env
```

Add your credentials:

```
INFURA_API_KEY=your_infura_api_key_here
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_here
```

⚠️ **Never commit your `.env` file to version control!**

## Running the Application

### Start the Full Application

```bash
bin/dev
```

This starts both:
- Rails web server (port 3000)
- JavaScript build watcher

### Run Processes Separately

If `bin/dev` doesn't work, run processes individually:

```bash
# Terminal 1 - Rails server
bin/rails server

# Terminal 2 - JavaScript build watcher
npm run devjs
```

Then visit: `http://localhost:3000`

## Smart Contract Development

All Solidity contract commands should be run from the `hardhat` directory:

```bash
cd hardhat
```

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy to Sepolia Testnet

```bash
npx hardhat ignition deploy ignition/modules/RPS.js --network sepolia --reset
```

### Export Contract ABI

```bash
npx hardhat run scripts/exportABI.js
```

### Run Local Hardhat Node (Development)

```bash
npx hardhat node
```

## Deployed Contract

**Sepolia Testnet:**
- Contract Address: `0x5b664f7eF512527A96D3C995d317FA149e81b17b`
- Network: Sepolia (Chain ID: 11155111)

## Project Structure

```
BlockRockPaperScissors/
├── app/                    # Rails application
│   ├── assets/            # Compiled JavaScript assets
│   ├── controllers/       # Rails controllers
│   ├── javascript/        # React/TypeScript source
│   ├── models/           # Rails models
│   └── views/            # Rails views
├── hardhat/              # Solidity smart contracts
│   ├── contracts/        # Solidity source files
│   ├── ignition/         # Deployment modules
│   ├── scripts/          # Utility scripts
│   └── test/            # Contract tests
├── config/              # Rails configuration
├── db/                  # Database files
└── public/              # Static files
```

## Development Workflow

### Making Changes to Smart Contracts

1. Edit contracts in `hardhat/contracts/`
2. Compile: `npx hardhat compile`
3. Test locally: `npx hardhat node` (in one terminal)
4. Deploy locally for testing
5. Deploy to Sepolia: `npx hardhat ignition deploy ignition/modules/RPS.js --network sepolia --reset`
6. Export ABI: `npx hardhat run scripts/exportABI.js`

### Making Changes to Frontend

JavaScript/React files are in `app/javascript/components/`. The build process watches for changes automatically when running `npm run devjs`.

## Database Setup

```bash
bin/rails db:create
bin/rails db:migrate
```

## Testing

```bash
# Rails tests
bin/rails test

# Smart contract tests
cd hardhat
npx hardhat test
```

## Troubleshooting

### Ruby Version Not Installed

```bash
rbenv install 3.4.7
```

### Foreman Permission Denied

Run processes separately instead of using `bin/dev`:
```bash
bin/rails server  # Terminal 1
npm run devjs     # Terminal 2
```

### Missing Environment Variables

Ensure your `hardhat/.env` file contains:
- `INFURA_API_KEY`
- `SEPOLIA_PRIVATE_KEY`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Links

- Repository: https://github.com/nmdc00/BlockRockPaperScissors
- Issues: https://github.com/nmdc00/BlockRockPaperScissors/issues
