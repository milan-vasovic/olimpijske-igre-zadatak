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
        this.drawRank = null;
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
            groupRank: this.groupRank,
            drawRank: this.drawRank
        }

        return stats;
    }

    getFinalTeamStats() {
        let pointAllowed = 0;
        let pointsScored = 0;
        let difference = 0;
        this.wins.matches.forEach(metch => {
            let leftValue = +metch.result.split("-")[0];
            let rightValue = +metch.result.split("-")[1];
            pointsScored += leftValue;
            pointAllowed += rightValue;
            difference += +metch.difference;
        })

        this.losses.matches.forEach(metch => {
            let leftValue = +metch.result.split("-")[0];
            let rightValue = +metch.result.split("-")[1];
            pointsScored += leftValue;
            pointAllowed += rightValue;
            difference += +metch.difference;
        })

        let result = {
            name: this.name,
            wins: this.wins.count,
            losses: this.losses.count,
            points: this.points,
            pointsScored: pointsScored,
            pointAllowed: pointAllowed,
            difference: difference
        };

        return result;
    }

    playWithRest(teams) {
        const results = [];

        teams.forEach(team => {
            const result = this.startMatch(team);
            results.push(result);
        })

        return results;
    }

    setWinResult(data) {
        this.wins.count += 1;
        this.wins.matches.push({
            opponent: data.name,
            result: data.result,
            difference: data.difference
        })
        this.points += 3
    }

    setLosseResult(data) {
        this.losses.count += 1;
        this.losses.matches.push({
            opponent: data.name,
            result: data.result,
            difference: data.difference
        })
        this.points += 1
    }

    setGroupRank(num) {
        this.groupRank = num;
    }

    startMatch(team) {
        const rank = this.rank;
        const enemyTeam = team.getInfo();
        
        // console.log("\n")

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

        // console.log(`Stronger team: ${strongerTeamName} | ${strongerTeamRank}`);
        // console.log(`Weaker team: ${weakerTeamName} | ${weakerTeamRank}`);

        const probabilityToWin = calculateWinProbability(weakerTeamRank, strongerTeamRank);
        const random = Math.random();

        // console.log("Probability to win: " + probabilityToWin);
        // console.log("Random: " + random);

        let result = random < probabilityToWin ? this.name : enemyTeam.name;

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
                result: `${winScore}-${losseScor}`,
                difference: winScore - losseScor
            }
            this.setWinResult(dataForWin);

            const dataForLosse = {
                name: this.name,
                result: `${losseScor}-${winScore}`,
                difference: losseScor - winScore
            }
            team.setLosseResult(dataForLosse);
        } else {
            const dataForLosse = {
                name: enemyTeam.name,
                result: `${losseScor}-${winScore}`,
                difference: losseScor - winScore
            }
            this.setLosseResult(dataForLosse);

            const dataForWin = {
                name: this.name,
                result: `${winScore}-${losseScor}`,
                difference: winScore - losseScor
            }
            team.setWinResult(dataForWin);
        }

        console.log(`${this.name} (${this.code}) VS ${enemyTeam.name} (${enemyTeam.code})`)
        let newResult = `Winner: ${result} (${winScore} : ${losseScor})`;
        console.log(newResult);
        return newResult;
    }
}

class Group {
    constructor(name, teams) {
        this.name = name;
        this.teams = teams.map(team => new Team(team, name));
        this.firstPlaced = null;
        this.secondPlaced = null;
        this.thirdPlaced = null;
        this.fourthPlaced = null;
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

    getFinalGroupStats() {
        const results = [];

        let output  = `Group ${this.name}: Name / Wins / Losses / Points Scored / Points Allowed / Difference`;
        this.teams.forEach((team, index) => {
            const stat = team.getFinalTeamStats();
            results.push(stat);
            output += `\n${index + 1}. ${stat.name}   ${stat.wins} / ${stat.losses} / ${stat.points} / ${stat.pointsScored} / ${stat.pointAllowed} / ${stat.difference}`;
        })
        console.log(output);
        return results;
    }

    getPlaces() {
        const data = {
            first: this.firstPlaced,
            second: this.secondPlaced,
            third: this.thirdPlaced,
            fourth: this.fourthPlaced
        }

        return data;
    }

    startMatches() {
        console.log("\n")
        console.log("========================================================");
        console.log("Group: " + this.name + " has stated!");
        const teams = [...this.teams];
        const results = [];

        while (teams.length > 1) {
            const chosenTeam = teams[0];
            console.log("\n")
            console.log("Team: " + chosenTeam.name + " Playing!");
            console.log("--------------------------------------------------------")
            teams.shift();
            const result = chosenTeam.playWithRest(teams);
            results.push(result);
        }

        return results;
    }

    setScoresToTeams() {
        this.teams.sort((a, b) => b.points - a.points);
    
        const teamStats = this.getTeamsStats();
    
        for (let i = 0; i < teamStats.length; i++) {
            teamStats[i].groupRank = i + 1;
    
            if (i + 1 < teamStats.length) {
                if (teamStats[i].points === teamStats[i + 1].points) {
                    const currentTeam = teamStats[i];
                    const nextTeam = teamStats[i + 1];
    
                    // Check if current team has won against the next team
                    const currentTeamWon = currentTeam.wins.matches.some(match => match.opponent === nextTeam.name);
                    const nextTeamWon = nextTeam.wins.matches.some(match => match.opponent === currentTeam.name);
    
                    if (currentTeamWon && !nextTeamWon) {
                        // current team wins, keep ranking as is
                        nextTeam.groupRank = i + 2;
                    } else if (!currentTeamWon && nextTeamWon) {
                        // next team wins, swap ranks
                        currentTeam.groupRank = i + 2;
                        nextTeam.groupRank = i + 1;
                        // swap positions in the array
                        [teamStats[i], teamStats[i + 1]] = [teamStats[i + 1], teamStats[i]];
                    }
                }
            }
        }
    
        this.firstPlaced = teamStats[0];
        this.secondPlaced = teamStats[1];
        this.thirdPlaced = teamStats[2];
        this.fourthPlaced = teamStats[3];
    }
}

class Draw {
    constructor(groups, groupResults) {
        this.groups = [...groups];
        this.groupResults = [...groupResults];
        this.drawD = null;
        this.drawE = null;
        this.drawF = null;
        this.drawG = null;
    }

    creatDraw() {
        let firstPlacedTeams = groups.map(group => group.firstPlaced);
        let secondPlacedTeams = groups.map(group => group.secondPlaced);
        let thirdPlacedTeams = groups.map(group => group.thirdPlaced);

        firstPlacedTeams.sort((a, b) => b.points - a.points);
        secondPlacedTeams.sort((a, b) => b.points - a.points);
        thirdPlacedTeams.sort((a, b) => b.points - a.points);

        // console.log(firstPlacedTeams);
        // console.log(secondPlacedTeams);
        // console.log(thirdPlacedTeams);
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
        } catch (err) {
            console.log("Unable to parse JSON " + err);
        }
    });
}

function calculateWinProbability(weakerRank, strongerRank, base = 400) {
    const difference = weakerRank - strongerRank;
    return  1 / (1 + Math.pow(10, difference / base));
}

function getRandomScoreNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function start() {
    const groupResults = [];

    await getTeams();

    // console.log(groups.length);

    groups.forEach(group => {
        group.startMatches();
        // group.getTeamsStats();
        group.setScoresToTeams();
    })

    groups.forEach(g => {
        // console.log(g.getPlaces());
        console.log('\n');
        groupResults.push(g.getFinalGroupStats());
    })

    console.log('\n');

    const draws = new Draw(groups, groupResults);

    draws.creatDraw();
}
// ____________________________________________________________________Function calling________________________________________________________________

start();
// getExibitions();