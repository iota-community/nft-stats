const fs = require('fs');
const fsPromise = fs.promises;
const { parse, stringify } = require('csv');
const readline = require('readline');

const IOTA_LINK_CSV_FILE = './data-iotalink-quest/iota-link.csv';
const DATA_L2_L1_ADDRESS_INPUT_FILE = './data-L2-L1-address/L2Address.csv';
const DATA_L2_L1_ADDRESS_RESULT_FILE = './data-L2-L1-address/L2-L1-Address.csv';

let L2AddressListFromInputFile = [];

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

function caseInsensitiveIncludes(arr, searchStr) {
    return arr.some(item => item.toLowerCase().includes(searchStr.toLowerCase()));
}

async function main() {
    // Read the file "iota-link.csv" line by line.
    // For each line, split based on the format `L1Address,L2Address,Digest` to extract L1Address and L2Address
    // For each L1Address, calculate the points based on the number of times its L2Address appears in the files in the folder "data-evm-quest".
    // Mark the L2Address as already counted to avoid double counting.
    // For next cycle, if the L2Address is already counted, skip it. If L1Address is already counted, overwrite the points if the new points are higher.

    console.log(`Getting L2 addresses from input file: ${DATA_L2_L1_ADDRESS_INPUT_FILE}...`);
    L2AddressListFromInputFile = await extractDataFromCSV(DATA_L2_L1_ADDRESS_INPUT_FILE, '\n', 1, 0);
    // console.log('L2 addresses extracted from input file:', L2AddressListFromInputFile);

    try {
        console.log(`Reading ${IOTA_LINK_CSV_FILE} file...`);

        const fileStream = await fsPromise.open(IOTA_LINK_CSV_FILE, 'r'); // Open file for reading
        const rl = readline.createInterface({
            input: fileStream.createReadStream(),
            crlfDelay: Infinity
        });

        const csvColumns = ['L2Address', 'L1Address', 'Digest'];
        let csvData = [];

        console.log(`Fetching L1 address from L2 address...`);

        // Read the file line by line
        let skipFirstLine = false;
        for await (const line of rl) {
            if (!skipFirstLine) {
                skipFirstLine = true; // Skip the first line (header)
                continue;
            }

            // Format of the file "iota-link.csv" is: L1Address,L2Address,Digest
            const [L1Address, L2Address, digest] = line.split(',');

            if (caseInsensitiveIncludes(L2AddressListFromInputFile, L2Address)) {
                csvData.push([L2Address, L1Address, digest]);
            }
        }

        await fileStream.close(); // Close the file when done

        console.log('Writing result to CSV file...');

        stringify(csvData, { header: true, columns: csvColumns, delimiter: ',' }, (err, output) => {
            if (err) {
                throw new Error('CSV writing error: ' + err.message);
            }
            fs.writeFileSync(DATA_L2_L1_ADDRESS_RESULT_FILE, output);
            console.log(`Successfully written result to ${DATA_L2_L1_ADDRESS_RESULT_FILE}`);
        });
    } catch (error) {
        console.error('Error reading file:', error);
        await fileStream.close(); // Close the file when done
    }
}

main().catch(err => console.error(err));

