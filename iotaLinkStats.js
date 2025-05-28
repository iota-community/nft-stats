require('dotenv').config({ path: './.env.iota.link.stats' });
const { IotaClient, getFullnodeUrl } = require('@iota/iota-sdk/client');
const fs = require('fs');
const { stringify } = require('csv');

const IOTA_LINK_CSV_FILE = './data-iotalink-quest/iota-link.csv';

async function main() {
    const { NETWORK, MOVE_PACKAGE_ID, MOVE_MODULE, MOVE_FUNCTION } = process.env;

    const client = new IotaClient({ url: getFullnodeUrl(NETWORK) || (NETWORK === 'mainnet' ? 'https://api.mainnet.iota.cafe' : 'https://api.testnet.iota.cafe') });

    const queriedTxs = [];
    let hasNextPageFlag = false;
    let cursor = null;

    console.log('Querying transactions...');

    do {
        const { data, nextCursor, hasNextPage } = await client.queryTransactionBlocks({
            filter: {
                MoveFunction: {
                    package: MOVE_PACKAGE_ID,
                    module: MOVE_MODULE,
                    function: MOVE_FUNCTION,
                },
            },
            options: {
                showInput: true,
            },
            order: "ascending",
            limit: 50,
            cursor,
        });

        hasNextPageFlag = hasNextPage;
        cursor = nextCursor;

        queriedTxs.push(...data);
        console.log('queriedTxs.length:', queriedTxs.length);

        // Only for test
        // break;
    } while (hasNextPageFlag);

    console.log('Extracting data...');

    const csvColumns = ['L1Address', 'L2Address', 'Digest'];
    let csvData = [];
    for (const dat of queriedTxs) {
        const digest = dat.digest;
        const L1Address = dat.transaction.data.sender;
        const L2Address = (dat.transaction.data.transaction.inputs.filter(input => input.valueType === '0x1::string::String'))[0]?.value;

        // If L2Address is empty, it means the object was deleted
        if (L2Address) {
            csvData.push([L1Address, L2Address, digest]);
        }
    }

    console.log('Writing result to CSV file...');

    stringify(csvData, { header: true, columns: csvColumns, delimiter: ',' }, (err, output) => {
        if (err) {
            throw new Error('CSV writing error: ' + err.message);
        }
        fs.writeFileSync(IOTA_LINK_CSV_FILE, output);
        console.log(`Successfully written IOTA Link query result to ${IOTA_LINK_CSV_FILE}`);
    });
}

main().catch(err => console.error(err));

