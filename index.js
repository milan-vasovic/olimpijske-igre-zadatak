const { match } = require('assert');

// _________________________________________________________Necessary Imports______________________________________________________________
const fs = require('fs').promises;

// Class definitions
class Team {
    constructor(teamData, group) {
        this.name = teamData.Team;
        this.code = teamData.ISOCode;
        this.rank = teamData.FIBARanking;
        this.group = group;
        this.groupRank = null;
        this.points = 0;
        this.wins = {
            count: 0,
            matches: []
        };
        this.losses = {
            count: 0,
            matches: []
        };
    }

    getInfo() {
        // console.log(`\nTeam: ${this.name}, ISOCode: ${this.code}, FIBARanking: ${this.rank}, Group: ${this.group}`);
        const team = {
            name: this.name,
            code: this.code,
            rank: this.rank,
            group: this.group
        };

        return team;
    }

    getStats() {
        const stats = {
            name: this.name,
            wins: {
                count: this.wins.count,
                matches: this.wins.matches
            },
            losses: {
                count: this.losses.count,
                matches: this.losses.matches
            },
            points: this.points,
            groupRank: this.groupRank
        }

        console.log(JSON.stringify(stats, null, 2));

        return stats;
    }

    playWithRest(teams) {
        const results = [];

        teams.forEach(team => {
            const result = this.startMatch(team);
            results.push("Winner: " + result);
        })

        console.log("--------------------------------------------------------")
        console.log("Result of metches: ");
        results.forEach(i => console.log(i));
        console.log('\n');
        return results;
    }

    setWinResult(data) {
        this.wins.count += 1;
        this.wins.matches.push({
            opponent: data.name,
            result: data.result
        })
        this.points += 3
        console.log("Win result saved!");
    }

    setLosseResult(data) {
        this.losses.count += 1;
        this.losses.matches.push({
            opponent: data.name,
            result: data.result
        })
        this.points += 1
        console.log("Losse result saved!");
    }

    setGroupRank(num) {
        this.groupRank = num;
    }

    startMatch(team) {
        const rank = this.rank;
        const enemyTeam = team.getInfo();
        
        console.log("--------------------------------------------------------")
        console.log(`${this.name} (${this.code}) VS ${enemyTeam.name} (${enemyTeam.code})`)

        let strongerTeamRank, strongerTeamName, weakerTeamRank, weakerTeamName;

        // if enemyTeam.rank is greater then this team rank it means that this team is stronger
        if (rank < enemyTeam.rank) {
            strongerTeamRank = rank;
            strongerTeamName = this.name;
            weakerTeamRank = enemyTeam.rank;
            weakerTeamName = enemyTeam.name;
        } else {
            strongerTeamRank = enemyTeam.rank;
            strongerTeamName = enemyTeam.name;
            weakerTeamRank = rank;
            weakerTeamName = this.name;
        }

        console.log(`Stronger team: ${strongerTeamName} | ${strongerTeamRank}`);
        console.log(`Weaker team: ${weakerTeamName} | ${weakerTeamRank}`);

        const probabilityToWin = calculateWinProbability(weakerTeamRank, strongerTeamRank);
        const random = Math.random();

        console.log("Probability to win: " + probabilityToWin);
        console.log("Random: " + random);

        const result = random < probabilityToWin ? this.name : enemyTeam.name
        console.log(result);

        let winScore, losseScor;

        const firstScore = getRandomScoreNumber(0, 120);
        const secondScore = getRandomScoreNumber(0, 120);

        if (firstScore > secondScore) {
            winScore = firstScore;
            losseScor = secondScore;
        } else {
            if (firstScore == secondScore) {
                winScore = secondScore;
                losseScor = firstScore-1;
            } else {
                winScore = secondScore;
                losseScor = firstScore;
            }
        }

        if (result.toString() === this.name.toString()) {
            const dataForWin = {
                name: enemyTeam.name,
                result: `${winScore}-${losseScor}`
            }
            this.setWinResult(dataForWin);

            const dataForLosse = {
                name: this.name,
                result: `${losseScor}-${winScore}`
            }
            team.setLosseResult(dataForLosse);
        } else {
            const dataForLosse = {
                name: enemyTeam.name,
                result: `${losseScor}-${winScore}`
            }
            this.setLosseResult(dataForLosse);

            const dataForWin = {
                name: this.name,
                result: `${winScore}-${losseScor}`
            }
            team.setWinResult(dataForWin);
        }

        return result;
    }
}

class Group {
    constructor(name, teams) {
        this.name = name;
        this.teams = teams.map(team => new Team(team, name));
        this.firstPlaced = null;
        this.secondPlaced = null;
        this.thirdPlaced = null;
    }

    getTeams() {
        return this.teams.map(team => team.getInfo());
    }

    getTeamsStats() {
        return this.teams.map(team => team.getStats());
    }

    getInfo() {
        return `Name: ${this.name}, teams: ${this.getTeams()}`;
    }

    startMatches() {
        console.log('\n')
        console.log("============================================");
        console.log("Group: " + this.name + " has stated!");
        const teams = [...this.teams];
        const results = [];

        while (teams.length > 1) {
            const chosenTeam = teams[0];
            console.log("Team: " + chosenTeam.name + " Playing!");
            teams.shift();
            const result = chosenTeam.playWithRest(teams);
            results.push(result);
        }

        return results;
    }


}

// ____________________________________________________________Global variables______________________________________________________________
const teams = [];
const groups = [];

// ______________________________________________________________Function definitions_______________________________________________________________
async function getTeams() {
    const filePath = './groups.json';

    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);
            
        for (let group in jsonData) {
            const newGroup = new Group(group, jsonData[group]);
            groups.push(newGroup);
            
            jsonData[group].forEach(team => {
                const newTeam = new Team(team, group);
                teams.push(newTeam);
            });
        }
    } catch (err) {
        console.log("Unable to parse JSON " + err);
    }
}

function getExibitions() {
    filePath = './exibitions.json';

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            return console.log("Unable to read file " + err);
        }

        try {
            const jsonData = JSON.parse(data);
            console.log(jsonData);
        } catch (err) {
            console.log("Unable to parse JSON " + err);
        }
    });
}

function calculateWinProbability(weakerRank, strongerRank, base = 400) {
    const difference = weakerRank - strongerRank;
    console.log(`difference: ${difference}`);
    return  1 / (1 + Math.pow(10, difference / base));
}

function getRandomScoreNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function start() {
    await getTeams();

    // console.log(groups.length);

    groups.forEach(group => {
        console.log("start");
        group.startMatches();
        group.getTeamsStats();
    })
}
// ____________________________________________________________________Function calling________________________________________________________________

start();
// getExibitions();