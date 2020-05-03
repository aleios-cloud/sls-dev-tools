import NoDefaultMemory from './rules/best_practices/no-default-memory'
import chalk from 'chalk';

const infoLog = chalk.greenBright;
const titleLog = chalk.greenBright.underline.bold;
const fail = chalk.redBright;
const failTitleLog = chalk.redBright.underline.bold;

class GuardianCI {
    constructor(AWS, stackName) {
        this.exitCode = 0;
        if (!AWS) {
            console.error("Invalid AWS SDK");
            this.exitCode = 1;
        }
        if (!stackName) {
            console.error("Invalid Cloudformation Stack Name");
            this.exitCode = 1;
        }
        this.AWS = AWS;
        this.stackName = stackName;
    }
    async runChecks() {
        console.log(chalk.greenBright(`
         ‗‗‗‗‗‗‗‗‗‗‗‗‗‗‗†‗‗‗‗‗‗‗‗‗‗‗‗‗‗
                        ╿
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                ▓       ▓       ▓
                ▓       ▓       ▓
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  
                ╿               ╿
                  sls-dev-tools        
                    GUARDIAN

        `))
        if (this.exitCode != 0) {
            return;
        }
        console.group(titleLog(" > Running checks"))
        const check1 = new NoDefaultMemory(this.AWS, this.stackName)
        process.stdout.write(infoLog(`   > ${check1.name}... `));
        const check1Result = await check1.run();
        console.log(check1Result ? "✅" : "❌")
        console.groupEnd()

        if(!check1Result) {
            console.group(chalk.blueBright.underline(failTitleLog(" > Failing Checks")))
            console.log(fail(check1.name));
            console.log(fail(check1.failureMessage));
            console.log(infoLog(check1.rulePage));
            console.table(check1.failingResources);
            console.groupEnd()
        }

        if(!check1Result) {
            this.exitCode = 1;
        }

        return this.exitCode;
    }
}

export default GuardianCI;