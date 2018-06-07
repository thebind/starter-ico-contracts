# ico-contracts

# Requirement

## ganache truffle for mac

download & install to your PC.
http://truffleframework.com/ganache/

# Command

## Compile

```
$ node ./ethereum/compile.js
```

## Deploy

```
$ node ./ethereum/deploy.js
```

After deploying the contract, please check address.

# Development Command

## develop mode

```
$ truffle develop
truffle(develop)> migrate --compile-all --network=develop --reset
```

## ganache development mode

```
$ truffle migrate --compile-all --network=ganache --reset
$ truffle console --network ganache
```

## Test Command

```
$ truffle test --network ganache
```
