const fs = require('fs');
const fsPromise = fs.promises;
const { parse, stringify } = require('csv');
const path = require('path');
const readline = require('readline');

const IOTA_LINK_CSV_FILE = './data-iotalink-quest/iota-link.csv';
const DATA_EVM_QUESTS_FOLDER = './data-evm-quest';
const POINTS_RESULT_FILE = './data-points/points.csv';

// Nested list
const L2AddressListFromEvmQuests = [];

const L2AddressListAlreadyCounted = [];

async function extractDataFromCSV(filePath, delimiter, from_line, column) {
    try {
        const fileContent = await fsPromise.readFile(filePath, 'utf-8');

        return new Promise((resolve, reject) => {
            parse(fileContent, { delimiter, from_line }, (err, records) => {
                if (err) {
                    reject(`Error parsing CSV: ${err}`);
                    return;
                } ``

                const columnData = records.map(row => row[column]);
                const columnDataUnique = [...new Set(columnData)]; // Remove duplicates
                resolve(columnDataUnique);
            });
        });
    } catch (error) {
        console.error('File read error:', error);
    }
}

async function getL2AddressListFromEvmQuests() {
    const files = await fsPromise.readdir(DATA_EVM_QUESTS_FOLDER);

    if (files.length === 0) {
        throw new Error(`No files found in folder: ${DATA_EVM_QUESTS_FOLDER}`);
    }

    for (const file of files) {
        if (file.startsWith('.')) {
            continue; // Skip hidden files
        }
        console.log('Processing file:', file);
        const filePath = path.join(DATA_EVM_QUESTS_FOLDER, file);
        const evmQuestAddresses = await extractDataFromCSV(filePath, '\n', 1, 0);
        L2AddressListFromEvmQuests.push(evmQuestAddresses);
    }
}

function calcPointsForL2AddressAgainstEvmQuests(L2Address) {
    let occurances = 0;
    for (const evmQuestAddresses of L2AddressListFromEvmQuests) {
        if (evmQuestAddresses.includes(L2Address)) {
            occurances++;
        }
    }
    const points = (occurances + 1) * (occurances + 1);
    return points;
}

async function main() {
    // Read the file "iota-link.csv" line by line.
    // For each line, split based on the format `L1Address,L2Address,Digest` to extract L1Address and L2Address
    // For each L1Address, calculate the points based on the number of times its L2Address appears in the files in the folder "data-evm-quest".
    // Mark the L2Address as already counted to avoid double counting.
    // For next cycle, if the L2Address is already counted, skip it. If L1Address is already counted, overwrite the points if the new points are higher.

    console.log('Getting L2 addresses from EVM quests...');
    await getL2AddressListFromEvmQuests();

    try {
        console.log(`Reading ${IOTA_LINK_CSV_FILE} file...`);

        const fileStream = await fsPromise.open(IOTA_LINK_CSV_FILE, 'r'); // Open file for reading
        const rl = readline.createInterface({
            input: fileStream.createReadStream(),
            crlfDelay: Infinity
        });

        const csvColumns = ['L1Address', 'L2Address', 'Points'];
        let csvData = [];

        console.log(`Calculating points for L2 addresses against EVM quests...`);

        // Read the file line by line
        let skipFirstLine = false;
        for await (const line of rl) {
            if (!skipFirstLine) {
                skipFirstLine = true; // Skip the first line (header)
                continue;
            }

            const [L1Address, L2Address, digest] = line.split(',');

            // Skip if L2Address is empty or already counted
            if (L2AddressListAlreadyCounted.includes(L2Address)) {
                // console.log(`Skipping already counted L2 Address: ${L2Address} for L1 Address: ${L1Address}`);
                continue;
            }

            const points = calcPointsForL2AddressAgainstEvmQuests(L2Address);
            L2AddressListAlreadyCounted.push(L2Address); // Mark L2Address as counted
            // console.log(`L1 Address: ${L1Address}, L2 Address: ${L2Address}, Points: ${points}`);
            csvData.push([L1Address, L2Address, points]);
        }

        await fileStream.close(); // Close the file when done

        console.log('Writing result to CSV file...');

        stringify(csvData, { header: true, columns: csvColumns, delimiter: ',' }, (err, output) => {
            if (err) {
                throw new Error('CSV writing error: ' + err.message);
            }
            fs.writeFileSync(POINTS_RESULT_FILE, output);
            console.log(`Successfully written points result to ${POINTS_RESULT_FILE}`);
        });
    } catch (error) {
        console.error('Error reading file:', error);
        await fileStream.close(); // Close the file when done
    }
}

main().catch(err => console.error(err));

