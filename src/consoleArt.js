/**
 * This code was generated using the AI-Tools toolkit: https://github.com/JefroB/AI-Tools
 * Created by Jeffrey Charles Bornhoeft with AI assistance as a Prime8 Engineering research project.
 */

/**
 * Console Art Utility
 * 
 * This module provides ASCII art and licensing information to be displayed
 * in the console when scripts are run. It serves as an easter egg and
 * provides branding for the AI-Tools library.
 */

// Import chalk for colorful console output
const chalk = require('chalk');

// ASCII art for GROBOT1X
const GROBOT_ASCII_ART = `
=*################+                                           
                                =#############################*                                     
                            #######################################                                 
                         #############################################-                             
                      ##############    :*############:-##*##############                           
                   :###########-  +############## *########################+                        
                 =##########  +#################   ###.#########*::##########*                      
                #########+:##################:      :+# #######################=                    
              ##########-###############       :::+*##*:#########################                   
            -######################      :::::+====+*###*===#############:########+                 
           *#######-:###########    ::::::::::::-=============-*###########*########                
          ####################  .:::   ::::::::::===============# ##########:########               
         ########:##########  =--- -  :::::::::::================#+*##################              
        #######+:########## .==-  .:::::::::::::==================*# ##########:#######             
       *######*########### ===:::::::::::::::======================*# ##################            
       ######+=########## ===::::::::::::==========================###*##########*######*           
      ####### ########### ========================================*### ##################           
     *###### *########## ========#######==============*###=+#####***######################          
     ######* ########### ====+#           .*=======+=            ######*   ########:######          
    *###### ######*    : ===#                #+==#                :##*##+    #############*         
    ####### ######  ---+ ==*  =#*:.:---.:#           #.-++++++- :#######*---  #####*-######         
    ######- #####  :::-+#++.+++############=+##*##+++#####**#####+.+++##=:::- ######:######         
    ###### =##### #:::==###+++##**** --  -##++++++++##** =-    +##++####=-:::=#############         
    ###### *#####:#:::==#.=*#+#**** --  :*##+#####+*#** -=    **##+####*==::: #############         
    ###### +######:====+##=+#+#*** --  :**##+#####*+#* --    ***##+####*====#+#############         
    ######..######.#==***#-=#+*#* --   ***##+######+##=     ****#+*#+##**==*.##############         
    ######* #######.*****#-=+#+*##########++##+==+#++##########*++#+*##****-###############         
    ####### ########+***###===###*++++++###         *##*+++++*###*++###***#=###############         
    +###### -#######+*######====+*####     ###   ###     *##+++++++*######:########*######*         
     #######:#########.=*-*.+====*#.        ##:  ##:        ##=+++*##.:..#########+:######          
     *######################*#*=#-                            #**##.######################          
      ######################-###                               ###.##############-#######           
       ######################.#                                 #:######################:           
       *#######:###############                                 .##############-*#######            
        ########:##############   #                         ==  *##############=#######             
         #########*#############   . ##                 =#..    #############:########              
          *#######+:######.  *###    ..   ###########=  ...   *###*+ #######:########               
           +########=      .++*####:    .....      ....    .:###*****++  #-########*                
             ##       -==++++=+*#####:.       ....       ::#####**#*****+++=   ###                  
              +###+========++=***#######:.            ::#######**#****  *****####                   
                ####+========++#############=::::::*##########*##***  *****####                     
                  ####=+==++==++################################*  #*****####                       
                    ####===#+++++############################   *##*#**####                         
                      +###*=#+#*+*#####################:   =############*                           
                         *#######+##########+-.  .-*##################                              
                            :#####################################=                                 
                                 #############################                                      
                                       =+#############+=                                            
                                                                                                    
                                                                                                    
##############   ###############   *####  ######-       -######  ###############   :==============. 
###############* ################  *####  #######      -#######  ###############   ================ 
####       *#### ####        ####+ *####  ########     ########  ####=            +====        ==== 
####        #### ####        ####: *####  ####:####   #### ####  ##############    -==============: 
###############* ################  *####  ####  #### ####  ####  ##############   :================.
###############  ################  *####  ####   #######   ####  ####=            ====-        -====
####             ####=       ####  *####  ####   -#####    ####  ###############  ==================
####             ####        ####  *####  ####    +###+    ####  ###############   ================ 
                                                                                                    
######   :#+   ##     +###*    ##    #=   #*   -#####:   ######    ####+     ##   .#=   #*     =### 
##        ###  ##    ##        ##    ###  #+   -#+       ##       +#:  ##    ##   =##*  #*   -#*    
#####=    #:## ##   *#         ##    # ## #+   -####*    #####    +#-+-##    ##   +#+## #*   ##     
##        #  *###   *#   ##    ##    #  ###+   -#=       ##       -#: ##     ##    #  ###*   ##   #*
######    #   =##    =#####    ##    #   *#*   -#####-   ######   +#:  ##    ##    #   *#+    #####*
`;

// Licensing information
const LICENSE_INFO = `
AI-Tools - A comprehensive toolkit for AI assistants
MIT License - Copyright (c) 2025 Jeffrey Charles Bornhoeft
https://github.com/JefroB/AI-Tools
`;

// Color themes for the ASCII art
const THEMES = {
  default: {
    art: chalk.cyan,
    license: chalk.white,
    highlight: chalk.yellow
  },
  success: {
    art: chalk.green,
    license: chalk.white,
    highlight: chalk.yellow
  },
  error: {
    art: chalk.red,
    license: chalk.white,
    highlight: chalk.yellow
  },
  warning: {
    art: chalk.yellow,
    license: chalk.white,
    highlight: chalk.cyan
  }
};

/**
 * Displays the ASCII art and licensing information in the console
 * 
 * @param {Object} options - Display options
 * @param {string} options.theme - Color theme to use ('default', 'success', 'error', 'warning')
 * @param {boolean} options.showLicense - Whether to show the license information
 * @param {string} options.additionalMessage - Additional message to display after the art
 */
function displayConsoleArt(options = {}) {
  const {
    theme = 'default',
    showLicense = true,
    additionalMessage = ''
  } = options;

  const selectedTheme = THEMES[theme] || THEMES.default;

  // Display ASCII art
  console.log(selectedTheme.art(GROBOT_ASCII_ART));

  // Display license information if requested
  if (showLicense) {
    console.log(selectedTheme.license(LICENSE_INFO));
  }

  // Display additional message if provided
  if (additionalMessage) {
    console.log(selectedTheme.highlight(additionalMessage));
  }

  // Add a blank line for better readability
  console.log('');
}

/**
 * Displays a success message with the ASCII art
 * 
 * @param {string} message - Success message to display
 */
function displaySuccess(message = '') {
  displayConsoleArt({
    theme: 'success',
    additionalMessage: message || 'Operation completed successfully!'
  });
}

/**
 * Displays an error message with the ASCII art
 * 
 * @param {string} message - Error message to display
 */
function displayError(message = '') {
  displayConsoleArt({
    theme: 'error',
    additionalMessage: message || 'An error occurred during operation.'
  });
}

/**
 * Displays a warning message with the ASCII art
 * 
 * @param {string} message - Warning message to display
 */
function displayWarning(message = '') {
  displayConsoleArt({
    theme: 'warning',
    additionalMessage: message || 'Warning: Proceed with caution.'
  });
}

module.exports = {
  displayConsoleArt,
  displaySuccess,
  displayError,
  displayWarning,
  GROBOT_ASCII_ART,
  LICENSE_INFO
};
