import NoDefaultMemory from './rules/best_practices/no-default-memory'

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
        console.log(`
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

        `)
        if (this.exitCode != 0) {
            return;
        }
        console.log(" > Running checks")
        const check1 = new NoDefaultMemory(this.AWS, this.stackName)
        process.stdout.write(`   > ${check1.name}... `);
        const check1Result = await check1.run();
        console.log(check1Result ? "✅" : "❌")

        if(!check1Result) {
            this.exitCode = 1;
        }

        return this.exitCode;
    }
}

export default GuardianCI;