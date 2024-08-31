// _________________________________________________________Necessary Imports______________________________________________________________
const fs = require('fs').promises;

//__________________________________________________________Class definitions______________________________________________________________

// Team class represents a basketball team with properties such as name, rank, group, etc.
// Provides methods to simulate matches, track wins/losses, and compute statistics.
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

    // Returns basic team information
    getInfo() {
        const team = {
            name: this.name,
            code: this.code,
            rank: this.rank,
            group: this.group
        };

        return team;
    }

    // Returns current team stats, including wins, losses, and points
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

    // Calculate and return final team stats after all matches
    getFinalTeamStats() {
        let pointAllowed = 0;
        let pointsScored = 0;
        let difference = 0;

         // Calculate totals for wins and losses
        this.wins.matches.forEach(match => {
            let leftValue = +match.result.split("-")[0];
            let rightValue = +match.result.split("-")[1];
            pointsScored += leftValue;
            pointAllowed += rightValue;
            difference += +match.difference;
        })

        this.losses.matches.forEach(match => {
            let leftValue = +match.result.split("-")[0];
            let rightValue = +match.result.split("-")[1];
            pointsScored += leftValue;
            pointAllowed += rightValue;
            difference += +match.difference;
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

    // Play matches with all other teams in the group
    playWithRest(teams) {
        const results = [];

        teams.forEach(team => {
            const result = this.startMatch(team);
            results.push(result);
        })

        return results;
    }

    // Set results after a win
    setWinResult(data) {
        this.wins.count += 1;
        this.wins.matches.push({
            opponent: data.name,
            result: data.result,
            difference: data.difference
        })
        this.points += 3
    }

    // Set results after a loss
    setLossResult(data) {
        this.losses.count += 1;
        this.losses.matches.push({
            opponent: data.name,
            result: data.result,
            difference: data.difference
        })
        this.points += 1
    }

    // Set the team's rank in the group
    setGroupRank(num) {
        this.groupRank = num;
    }

    // Simulate a match between this team and another team
    startMatch(team) {
        const rank = this.rank;
        const enemyTeam = team.getInfo();

        let strongerTeamRank, weakerTeamRank;

        // If enemyTeam.rank is greater then this team rank it means that this team is stronger and vice versa
        if (rank < enemyTeam.rank) {
            strongerTeamRank = rank;
            weakerTeamRank = enemyTeam.rank;
        } else {
            strongerTeamRank = enemyTeam.rank;
            weakerTeamRank = rank;
        }

        // create probbabilty for win and random number to compare
        const probabilityToWin = calculateWinProbability(weakerTeamRank, strongerTeamRank);
        const random = Math.random();

        let result = random < probabilityToWin ? this.name : enemyTeam.name;

        let winScore, lossScor;

        // create random dummy scores and set them accordingly
        const firstScore = getRandomScoreNumber(0, 120);
        const secondScore = getRandomScoreNumber(0, 120);

        if (firstScore > secondScore) {
            winScore = firstScore;
            lossScor = secondScore;
        } else {
            if (firstScore == secondScore) {
                winScore = secondScore;
                lossScor = firstScore-1;
            } else {
                winScore = secondScore;
                lossScor = firstScore;
            }
        }

        // Write result data to team history
        if (result.toString() === this.name.toString()) {
            const dataForWin = {
                name: enemyTeam.name,
                result: `${winScore}-${lossScor}`,
                difference: winScore - lossScor
            }
            this.setWinResult(dataForWin);

            const dataForLoss = {
                name: this.name,
                result: `${lossScor}-${winScore}`,
                difference: lossScor - winScore
            }
            team.setLossResult(dataForLoss);
        } else {
            const dataForLoss = {
                name: enemyTeam.name,
                result: `${lossScor}-${winScore}`,
                difference: lossScor - winScore
            }
            this.setLossResult(dataForLoss);

            const dataForWin = {
                name: this.name,
                result: `${winScore}-${lossScor}`,
                difference: winScore - lossScor
            }
            team.setWinResult(dataForWin);
        }

        printToConsole(`${this.name} (${this.code}) VS ${enemyTeam.name} (${enemyTeam.code})`);
        let newResult = `Winner: ${result} (${winScore} : ${lossScor})`;
        printToConsole(newResult);
        return result;
    }
}

// Group class represents a group in a tournament, containing teams and methods to manage their matches and rankings.
class Group {
    constructor(name, teams) {
        this.name = name;
        this.teams = teams.map(team => new Team(team, name));
        this.firstPlaced = null;
        this.secondPlaced = null;
        this.thirdPlaced = null;
        this.fourthPlaced = null;
    }

    // Returns basic information about all teams in the group
    getTeams() {
        return this.teams.map(team => team.getInfo());
    }

    // Returns detailed statistics for all teams in the group
    getTeamsStats() {
        return this.teams.map(team => team.getStats());
    }

    // Calculates and logs the final statistics for the group
    getFinalGroupStats() {
        const results = [];

        let output  = `Group ${this.name}: Name / Wins / Losses / Points Scored / Points Allowed / Difference`;
        this.teams.forEach((team, index) => {
            const stat = team.getFinalTeamStats();
            results.push(stat);
            output += `\n${index + 1}. ${stat.name}   ${stat.wins} / ${stat.losses} / ${stat.points} / ${stat.pointsScored} / ${stat.pointAllowed} / ${stat.difference}`;
        })
        printToConsole(output);
        return results;
    }

    // Returns the teams that placed first, second, third, and fourth in the group
    getPlaces() {
        const data = {
            first: this.firstPlaced,
            second: this.secondPlaced,
            third: this.thirdPlaced,
            fourth: this.fourthPlaced
        }

        return data;
    }

    // Starts the matches within the group, where each team plays against the others
    startMatches() {
        printToConsole("Group: " + this.name + " has stated!", 1, 0, 1);
        const teams = [...this.teams];
        const results = [];

        while (teams.length > 1) {
            const chosenTeam = teams[0];
            printToConsole("Team: " + chosenTeam.name + " Playing!", 1);
            printToConsole(0, 0, 1);
            teams.shift();
            const result = chosenTeam.playWithRest(teams);
            results.push(result);
        }

        return results;
    }

    // Sets the final scores and rankings for the teams in the group
    setScoresToTeams() {
        // Sort teams based on points in descending order
        this.teams.sort((a, b) => b.points - a.points);
    
        const teamStats = this.getTeamsStats();
    
        for (let i = 0; i < teamStats.length; i++) {
            teamStats[i].groupRank = i + 1;
    
            if (i + 1 < teamStats.length) {
                // Check for teams with the same points
                if (teamStats[i].points === teamStats[i + 1].points) {
                    const currentTeam = teamStats[i];
                    const nextTeam = teamStats[i + 1];
    
                    // Determine if current team has won against the next team
                    const currentTeamWon = currentTeam.wins.matches.some(match => match.opponent === nextTeam.name);
                    const nextTeamWon = nextTeam.wins.matches.some(match => match.opponent === currentTeam.name);
    
                    if (currentTeamWon && !nextTeamWon) {
                        // If current team won the direct match, keep current ranking
                        nextTeam.groupRank = i + 2;
                    } else if (!currentTeamWon && nextTeamWon) {
                        // If next team won the direct match, swap their ranks
                        currentTeam.groupRank = i + 2;
                        nextTeam.groupRank = i + 1;
                        // Swap positions in the sorted array
                        [teamStats[i], teamStats[i + 1]] = [teamStats[i + 1], teamStats[i]];
                    }
                }
            }
        }
    
        // Set the final group placements based on the computed rankings
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
        this.quarterfinal = [];
        this.semifinal = [];
        this.teamsForThirdPlace = [];
        this.final = [];
        this.firstPlaced = null;
        this.secondPlaced = null;
        this.thirdPlaced = null;
    }

    // create the initial draw based on team placements from group stages
    createDraw() {
        let firstPlacedTeams = groups.map(group => group.firstPlaced);
        let secondPlacedTeams = groups.map(group => group.secondPlaced);
        let thirdPlacedTeams = groups.map(group => group.thirdPlaced);

        // Combine all teams and sort them by their performance
        const allTeams = [...firstPlacedTeams, ...secondPlacedTeams, ...thirdPlacedTeams]
        this.sortList(allTeams);

         // Assign teams to draw slots
        this.drawD = [allTeams[0], allTeams[1]];
        this.drawE = [allTeams[2], allTeams[3]];
        this.drawF = [allTeams[4], allTeams[5]];
        this.drawG = [allTeams[6], allTeams[7]];
    }

    // Randomly select teams by given rules to determine the quarterfinal, semifinal, third place and final matchups
    startSchema() {
        const teamNum1 = Math.round(Math.random());
        let teamNum2;

        switch (teamNum1) {
            case 0:
                teamNum2 = 1;
                this.quarterfinal.push([this.drawD[teamNum1], this.drawG[teamNum2]])
                this.quarterfinal.push([this.drawD[teamNum2], this.drawG[teamNum1]])
                this.quarterfinal.push([this.drawE[teamNum1], this.drawF[teamNum2]])
                this.quarterfinal.push([this.drawE[teamNum2], this.drawF[teamNum1]])
                break;
            case 1:
                teamNum2 = 0;
                this.quarterfinal.push([this.drawD[teamNum1], this.drawG[teamNum2]])
                this.quarterfinal.push([this.drawD[teamNum2], this.drawG[teamNum1]])
                this.quarterfinal.push([this.drawE[teamNum1], this.drawF[teamNum2]])
                this.quarterfinal.push([this.drawE[teamNum2], this.drawF[teamNum1]])
                break;
        }

        // Process quarterfinal matches and determine teams for semifinals
        printToConsole("Quarterfinals Matches:")
        this.quarterfinal.forEach(group => {
            const selectedTeam = teams.find(team => team.name === group[0].name);
            const enemyTeam = teams.find(team => team.name === group[1].name)
            const result = selectedTeam.startMatch(enemyTeam);
            printToConsole(0, 0, 1);
            if (result.toString() === selectedTeam.name.toString()) {
                this.semifinal.push(selectedTeam);
            } else {
                this.semifinal.push(enemyTeam);
            }
        })

        // Process semifinals and determine teams for the final and third place
        const firstSemifinalTeam1 = this.semifinal[0];
        const firstSemifinalTeam2 = this.semifinal[3];
        const secondSemifinalTeam1 = this.semifinal[1];
        const secondSemifinalTeam2 = this.semifinal[2];

        printToConsole("Semifinal Matches:", 1)
        const resultFirstSemifinal = firstSemifinalTeam1.startMatch(firstSemifinalTeam2);
        printToConsole(0, 0, 1);
        const resultSecondSemifinal = secondSemifinalTeam1.startMatch(secondSemifinalTeam2);

        // Determine third place contenders and final match results
        if (resultFirstSemifinal.toString() === firstSemifinalTeam1.toString()) {
            this.final.push(firstSemifinalTeam1);
            this.teamsForThirdPlace.push(firstSemifinalTeam2);
        } else {
            this.final.push(firstSemifinalTeam2);
            this.teamsForThirdPlace.push(firstSemifinalTeam1);
        }

        if (resultSecondSemifinal.toString() === secondSemifinalTeam1.toString()) {
            this.final.push(secondSemifinalTeam1);
            this.teamsForThirdPlace.push(secondSemifinalTeam2);
        } else {
            this.final.push(secondSemifinalTeam2);
            this.teamsForThirdPlace.push(secondSemifinalTeam1);
        }

        // Process third place match
        printToConsole('Match for third place:', 1);
        const resultForThirdPlace = this.teamsForThirdPlace[0].startMatch(this.teamsForThirdPlace[1]);

        if (resultForThirdPlace.toString() === this.teamsForThirdPlace[0].name) {
            this.thirdPlaced = this.teamsForThirdPlace[0];
        } else {
            this.thirdPlaced = this.teamsForThirdPlace[1];
        }

        // Process final match and determine the winners
        printToConsole('Final Match:', 1);
        const resultFinal = this.final[0].startMatch(this.final[1]);

        if (resultFinal.toString() === this.final[0].name) {
            this.firstPlaced = this.final[0];
            this.secondPlaced = this.final[1];
        } else {
            this.firstPlaced = this.final[1];
            this.secondPlaced = this.final[0];
        }

        printToConsole(`\nMedals:\n1. Gold - ${this.firstPlaced.name} (${this.firstPlaced.code})\n2. Silver - ${this.secondPlaced.name} (${this.secondPlaced.code})\n3. Bronze - ${this.thirdPlaced.name} (${this.thirdPlaced.code})`);
    }

    // Sort teams by points and handle ties by comparing points scored
    sortList(list) {
        const teamToSort = list;
        teamToSort.sort((a, b) => b.points - a.points);
    
        for (let i = 0; i < teamToSort.length; i++) {
            teamToSort[i].drawRank = i + 1;
  
            if (i + 1 < teamToSort.length) {
                if (teamToSort[i].points === teamToSort[i + 1].points) {
                    const currentTeam = teamToSort[i].name;
                    const nextTeam = teamToSort[i + 1].name;
    
                    const currentTeamPoints = this.getTeamPoints(currentTeam);

                    const nextTeamPoints = this.getTeamPoints(nextTeam);

                    if (currentTeamPoints > nextTeamPoints) {
                        teamToSort[i + 1].drawRank = i + 2;
                    } else if (currentTeamPoints < nextTeamPoints) {
                        teamToSort[i].drawRank = i + 2;
                        teamToSort[i + 1].drawRank = i + 1;
                        [teamToSort[i], teamToSort[i + 1]] = [teamToSort[i + 1], teamToSort[i]];
                    }
                }
            }
        }
    }
    
    // Retrieve the points scored by a team from the group results
    getTeamPoints(teamName) {
        for (const group of this.groupResults) {
            const foundTeam = group.find(team => team.name.toString() === teamName.toString());
            if (foundTeam) {
                return foundTeam.pointsScored;
            }
        }
        return 0;
    }
}

// ____________________________________________________________Global variables______________________________________________________________
const teams = [];
const groups = [];

// ______________________________________________________________Function definitions_______________________________________________________________

/**
 * Reads team data from a JSON file and initializes Group and Team objects.
 */
async function loadTeamsFromFile() {
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
        printToConsole("Unable to parse JSON " + err);
    }
}

// Calculates the probability of winning based on team ranks using the Elo rating system formula.
function calculateWinProbability(weakerRank, strongerRank, base = 400) {
    const difference = weakerRank - strongerRank;
    return  1 / (1 + Math.pow(10, difference / base));
}

// Generates a random score between a given minimum and maximum value.
function getRandomScoreNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Prints various formatted outputs to the console based on the provided parameters.
function printToConsole(par = false, newLine = false, deviderSmall = false, deviderBig = false) {
    if (newLine) {
        console.log('\n');
    }

    if (deviderSmall) {
        console.log('--------------------------------------------------------');
    }

    if (deviderBig) {
        console.log('========================================================');
    }

    if (par) {
        console.log(par);
    }
}

// Main function to initialize the tournament, process matches, and start the draw schema.
async function start() {
    // Array to hold the results of each group
    const groupResults = [];

    // Get team data and initialize Group and Team objects
    await loadTeamsFromFile();

     // Process each group: start matches and set scores for teams
    groups.forEach(group => {
        group.startMatches();
        group.setScoresToTeams();
    })

    // Collect final group statistics
    groups.forEach(g => {
        printToConsole(0, 1);
        groupResults.push(g.getFinalGroupStats());
    })

    console.log(0, 1);

    // Initialize the Draw class with groups and group results
    const draws = new Draw(groups, groupResults);

    // create the draw and start the schema for the tournament
    draws.createDraw();
    draws.startSchema();
}
// ____________________________________________________________________Function calling________________________________________________________________

// Start the program
start();
