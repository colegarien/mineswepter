describe("mine sweeping it", async function (){
    before(browser => browser.navigateTo('https://minesweeper.online/'));

    
    it('Start a game', async function(browser) {
        const minX = 0;
        const maxX = 29;
        const minY = 0;
        const maxY = 15;

        browser
            .waitForElementVisible('body')
            .waitForElementVisible('.level3-link')
            .click('.level3-link');

        // Wait for board to load and put it in screen
        browser
            .waitForElementVisible(by.id('cell_0_0'))
            .execute(function () { document.getElementById("top_area_face").scrollIntoView(); }, []);

        let board = {};
        let moves = [];
        for(x = minX; x <= maxX; x++) {
            board[x] = {};
            for(y = minY; y <= maxY; y++) {
                board[x][y] = {
                    id: '#cell_'+x+'_'+y,
                    x: x,
                    y: y,
                    element: browser.element.find(by.id('cell_'+x+'_'+y)),
                    value: -1,
                    isBomb: false
                };
            }
        }
        
        let makeMove = async function(browser, x, y){
            if(board[x][y].value !== -1){
                return;
            }

            board[x][y].element.click();
            browser.waitForElementVisible(board[x][y].id+'.hd_opened,.hd_type11');

            await populateBoard(browser, board[x][y], []);

            if(board[x][y].value === -1) {
                return;
            }

            // rebuild list of possible moves
            moves = [];
            
            for(x = minX; x <= maxX; x++) {
                for(y = minY; y <= maxY; y++) {
                    // ensure current block has no value yet
                    if(board[x][y].value >= 0 || board[x][y].isBomb){
                        continue;
                    }

                    // if has a neighbor that is okay, skip this closed block
                    if (isOkayDawg(x+1,y-1)
                        || isOkayDawg(x+1,y)
                        || isOkayDawg(x+1,y+1)
                        || isOkayDawg(x,y-1)
                        || isOkayDawg(x,y+1)
                        || isOkayDawg(x-1,y-1)
                        || isOkayDawg(x-1,y)
                        || isOkayDawg(x-1,y+1)
                    ) {
                        board[x][y].element.rightClick();
                        board[x][y].isBomb = true;
                        continue;
                    }
                }
            }

            for(x = minX; x <= maxX; x++) {
                for(y = minY; y <= maxY; y++) {
                    // ensure current block has no value yet
                    if(board[x][y].value >= 0 || board[x][y].isBomb){
                        continue;
                    }

                    let clickValue = shouldClickValue(x,y);
                    if(clickValue !== null){
                        moves.push( {
                            x: x,
                            y: y,
                            distance: clickValue,
                        });
                    }
                }
            }

            // order ascending, best move has lowest 'distance'
            moves = moves.sort((a, b) => {
                return a.distance - b.distance;
            });
        };

        let isOkayDawg = function(x, y) {
            if(x < minX || x > maxX || y < minY || y > maxY){
                return false;
            }

            return board[x][y].value == getPotentialBombCount(x,y);
        };
        let isKnownDawg = function(x, y) {
            if(x < minX || x > maxX || y < minY || y > maxY){
                return false;
            }

            return board[x][y].value == getKnownBombCount(x,y);
        };

        let getPotentialBombCount = function(x, y) {
            return countPotentialBombs(x+1,y-1)
                + countPotentialBombs(x+1,y)
                + countPotentialBombs(x+1,y+1)
                + countPotentialBombs(x,y-1)
                + countPotentialBombs(x,y+1)
                + countPotentialBombs(x-1,y-1)
                + countPotentialBombs(x-1,y)
                + countPotentialBombs(x-1,y+1);
        }

        let countPotentialBombs = function(x, y){
            if(x >= minX && x <= maxX && y >= minY && y <= maxY && board[x][y].value === -1){
                return 1;
            }

            return 0;
        }

        let getKnownBombCount = function(x, y) {
            return countKnownBombs(x+1,y-1)
                + countKnownBombs(x+1,y)
                + countKnownBombs(x+1,y+1)
                + countKnownBombs(x,y-1)
                + countKnownBombs(x,y+1)
                + countKnownBombs(x-1,y-1)
                + countKnownBombs(x-1,y)
                + countKnownBombs(x-1,y+1);
        }

        let countKnownBombs = function(x, y){
            if(x >= minX && x <= maxX && y >= minY && y <= maxY && board[x][y].isBomb){
                return 1;
            }

            return 0;
        }

        let shouldClickValue = function(x, y) {
            // whether or not should click a potential bomb
            if (isKnownDawg(x+1,y-1)
                || isKnownDawg(x+1,y)
                || isKnownDawg(x+1,y+1)
                || isKnownDawg(x,y-1)
                || isKnownDawg(x,y+1)
                || isKnownDawg(x-1,y-1)
                || isKnownDawg(x-1,y)
                || isKnownDawg(x-1,y+1)
            ) {
                // please click this
                return -999;
            }
            
            // return 9 - getKnownBombCount(x,y);
            return 0;
        };

        let populateBoard = async function(browser, cell, list) {
            if (cell.value!==-1) {
                return list;
            }

            const cellClasses = await cell.element.getAttribute('class');
            if (!cellClasses.includes('hd_opened')) {
                return list;
            }
            
            let x = cell.x;
            let y = cell.y;
            switch (true) {
                case cellClasses.includes('hd_type0'):
                    board[x][y].value = 0;
                    break;
                case cellClasses.includes('hd_type1'):
                    board[x][y].value = 1;
                    break;
                case cellClasses.includes('hd_type2'):
                    board[x][y].value = 2;
                    break;
                case cellClasses.includes('hd_type3'):
                    board[x][y].value = 3;
                    break;
                case cellClasses.includes('hd_type4'):
                    board[x][y].value = 4;
                    break;
                case cellClasses.includes('hd_type5'):
                    board[x][y].value = 5;
                    break;
                case cellClasses.includes('hd_type6'):
                    board[x][y].value = 6;
                    break;
                case cellClasses.includes('hd_type7'):
                    board[x][y].value = 7;
                    break;
                case cellClasses.includes('hd_type8'):
                    board[x][y].value = 8;
                    break;
                case cellClasses.includes('hd_type9'):
                    board[x][y].value = 9;
                    break;
                default:
                    board[x][y].value = -1;
                    break;
            }

            list.push(cell.id);
            if (x+1 <= maxX && !list.includes(board[x+1][y].id)) {
                list = await populateBoard(browser, board[x+1][y], list);
            }
            if (x-1 >= minX && !list.includes(board[x-1][y].id)) {
                list = await populateBoard(browser, board[x-1][y], list);
            }
            if (y+1 <= maxY && !list.includes(board[x][y+1].id)) {
                list = await populateBoard(browser, board[x][y+1], list);
            }
            if (y-1 >= minY && !list.includes(board[x][y-1].id)) {
                list = await populateBoard(browser, board[x][y-1], list);
            }

            return list;
        };

        let smilyButton = browser.element.find(by.id('top_area_face'));
        let running = true;
        do{
            if(moves.length === 0){
                await makeMove(browser, 13, 4);
            } else {
                let bestMoves = moves.filter(m => m.distance === moves[0].distance);
                let move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
                await makeMove(browser, move.x, move.y);

                if(board[move.x][move.y].value === -1) {
                    // Retry
                    board = {};
                    moves = [];
                    for(x = minX; x <= maxX; x++) {
                        board[x] = {};
                        for(y = minY; y <= maxY; y++) {
                            board[x][y] = {
                                id: '#cell_'+x+'_'+y,
                                x: x,
                                y: y,
                                element: browser.element.find(by.id('cell_'+x+'_'+y)),
                                value: -1,
                                isBomb: false
                            };
                        }
                    }
                    smilyButton.click();
                }
            }

            let smilyClasses = await smilyButton.getAttribute('class');
            if(smilyClasses?.includes('hd_top-area-face-win') ?? false){
                running = false;
            }
        }while(running);
        
        browser.saveScreenshot('./screenshots/winning.png');
    });
    
    after(browser => browser.end());
});