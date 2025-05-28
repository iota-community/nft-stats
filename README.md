# NFT Stats

Implemented by IOTA Foundation.

## Introduction

3 scripts are provided as follows

### iotaLinkStats.js

Used to query NFT stats of the [IOTA Link](https://iotalink.io). The result is stored into the CSV file `iota-link.csv` with the following format:

```
L1Address,L2Address,Digest
```

**Digest*, which is the tx hash of creating the IOTA Link NFT object, is provided to verify the link between L2Address and L1Address.

**Notice**

If the pair of `L1Address` and `L2Address` exists multiple times with different `Digest`, this means that the IOTA Link NFT was deleted and then re-created.

### calcPoints.js

Used to calculate points for each L1Address in the CSV file `iota-link.csv` in folder `data-iotalink-quest` based on the 9 CSV files in folder `data-evm-quest`.

The points are calculated as follows. 

If the L2Address appears 9 times in 9 CSV files (e.g. `1.csv`, `2.csv`, etc), then the linked L1Address (according to the resulting CSV file `iota-link.csv`) will get `10x10=100` points.

If the L2Address appears 6 times in 9 CSV files, it will get `7x7=49` points.

and so on... 

The result will be stored in the CSV file `points.csv` in folder `data-points` with the following format:

```
L1Address,L2Address,Points
```

**Notice**

If the L1Address is linked with multiple L2Addresses, then it will get the most points from one of the linked L2Addresses.

If multiple L1 addresses are linked by one L2 address, then only the first connected L1 address will get the points. The rest is ignored.

### getL1FromL2Address.js

Used to get L1Address from L2Address. The result is stored into the CSV file `L2-L1-address.csv` with the following format:

```
L2Address,L1Address,Digest
```

**Digest*, which is the tx hash of creating the IOTA Link NFT object, is provided to verify the link between L2Address and L1Address.

## Install

Run this cmd: `npm i`

## How to run

### Query NFT stats of the IOTA Link

Config is specified in the file `.env.iota.link.stats` (no need to change anything).

Run this cmd `npm run iota-link-stats`.

The result will be stored in the file `iota-link.csv` in folder `data-iotalink-quest`.

### Calculate points for each L1Address

Place 9 CSV files (e.g. `1.csv`, `2.csv`, ..., `9.csv`) into the folder `data-evm-quest`.
Each CSV file containing the L2Address where each address per line.

Ensure to run the step `npm run iota-link-stats` for generating the CSV file `iota-link.csv` in folder `data-iotalink-quest`.

Run this cmd `npm run calc-points`.

The result will be stored in the CSV file `points.csv` in folder `data-points`

### Get L1Address from L2Address

Place the file `L2Address.csv` into the folder `data-L2-L1-address`.

Ensure to run the step `npm run iota-link-stats` for generating the CSV file `iota-link.csv` in folder `data-iotalink-quest`.

Run this cmd `npm run L1-address`.

The result will be stored in the CSV file `L2-L1-address.csv` in folder `data-L2-L1-address`
