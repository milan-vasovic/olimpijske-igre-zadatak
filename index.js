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
    setLosseResult(data) {
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

        let strongerTeamRank, strongerTeamName, weakerTeamRank, weakerTeamName;

        // If enemyTeam.rank is greater then this team rank it means that this team is stronger and vice versa
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

        // Creat probbabilty for win and random number to compare
        const probabilityToWin = calculateWinProbability(weakerTeamRank, strongerTeamRank);
        const random = Math.random();

        let result = random < probabilityToWin ? this.name : enemyTeam.name;

        let winScore, losseScor;

        // Creat random dummy scores and set them accordingly
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

        // Write result data to team history
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

    // Returns the group's name and a list of teams
    getInfo() {
        return `Name: ${this.name}, teams: ${this.getTeams()}`;
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
        console.log(output);
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

    // Create the initial draw based on team placements from group stages
    creatDraw() {
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

    // Log the current draw information
    getInfo() {
        console.log(`\n${this.drawD}\n${this.drawE}\n${this.drawF}\n${this.drawG}`);
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
        console.log("Quaterfinals Matches:")
        this.quarterfinal.forEach(group => {
            const selectedTeam = teams.find(team => team.name === group[0].name);
            const enemyTeam = teams.find(team => team.name === group[1].name)
            const result = selectedTeam.startMatch(enemyTeam);
            console.log('--------------------------------------------------------');
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

        console.log('\n');
        console.log("Semifinal Matches:")
        const reslutFirstSemifinal = firstSemifinalTeam1.startMatch(firstSemifinalTeam2);
        console.log('--------------------------------------------------------');
        const reslutSecondSemifinal = secondSemifinalTeam1.startMatch(secondSemifinalTeam2);
        console.log('\n');

        // Determine third place contenders and final match results
        if (reslutFirstSemifinal.toString() === firstSemifinalTeam1.toString()) {
            this.final.push(firstSemifinalTeam1);
            this.teamsForThirdPlace.push(firstSemifinalTeam2);
        } else {
            this.final.push(firstSemifinalTeam2);
            this.teamsForThirdPlace.push(firstSemifinalTeam1);
        }

        if (reslutSecondSemifinal.toString() === secondSemifinalTeam1.toString()) {
            this.final.push(secondSemifinalTeam1);
            this.teamsForThirdPlace.push(secondSemifinalTeam2);
        } else {
            this.final.push(secondSemifinalTeam2);
            this.teamsForThirdPlace.push(secondSemifinalTeam1);
        }

        // Process third place match
        console.log('Match for third place:');
        const resultForThirdPlace = this.teamsForThirdPlace[0].startMatch(this.teamsForThirdPlace[1]);
        console.log('\n');

        if (resultForThirdPlace.toString() === this.teamsForThirdPlace[0].name) {
            this.thirdPlaced = this.teamsForThirdPlace[0];
        } else {
            this.thirdPlaced = this.teamsForThirdPlace[1];
        }

        // Process final match and determine the winners
        console.log('Final Match:');
        const resultFinal = this.final[0].startMatch(this.final[1]);

        if (resultFinal.toString() === this.final[0].name) {
            this.firstPlaced = this.final[0];
            this.secondPlaced = this.final[1];
        } else {
            this.firstPlaced = this.final[1];
            this.secondPlaced = this.final[0];
        }

        console.log(`\nMedals:\n1. Gold - ${this.firstPlaced.name} (${this.firstPlaced.code})\n2. Silver - ${this.secondPlaced.name} (${this.secondPlaced.code})\n3. Bronze - ${this.thirdPlaced.name} (${this.thirdPlaced.code})`);
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

// Calculates the probability of winning based on team ranks using the Elo rating system formula.
function calculateWinProbability(weakerRank, strongerRank, base = 400) {
    const difference = weakerRank - strongerRank;
    return  1 / (1 + Math.pow(10, difference / base));
}

// Generates a random score between a given minimum and maximum value.
function getRandomScoreNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Main function to initialize the tournament, process matches, and start the draw schema.
async function start() {
    // Array to hold the results of each group
    const groupResults = [];

    // Get team data and initialize Group and Team objects
    await getTeams();

     // Process each group: start matches and set scores for teams
    groups.forEach(group => {
        group.startMatches();
        group.setScoresToTeams();
    })

    // Collect final group statistics
    groups.forEach(g => {
        console.log('\n');
        groupResults.push(g.getFinalGroupStats());
    })

    console.log('\n');

    // Initialize the Draw class with groups and group results
    const draws = new Draw(groups, groupResults);

    // Create the draw and start the schema for the tournament
    draws.creatDraw();
    draws.startSchema();

}
// ____________________________________________________________________Function calling________________________________________________________________

// Start the programm
start();
