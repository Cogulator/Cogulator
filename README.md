# Cogulator
A Cognitive Modeling Calculator  
[cogulator.io](http://cogulator.io)

Cogulator, a portmanteau of Cognitive and Calculator, is a simple tool for task analysis and GOMS (Goals, Operators, Methods, and Selection Rules) modeling. It's designed to be approachable for new users and quick for experienced ones. To that end, Cogulator has a fairly limited feature set. You describe the task using CMN-GOMS (discussed more later) and Cogulator returns task time predictions and working memory load estimates. Anything that gets in the way of those basic tasks has been eliminated. In short, we have tried to create a tightly focused application for building GOMS models by applying basic human factors to a basic human factors tool.

# Project Page
More for information about Cogulator can be found at [cogulator.io](http://cogulator.io)

# Get Started
1. [Download](https://github.com/Cogulator/Cogulator/releases/download/v1.2/cogulator.air) & Install Cogulator
2. You're ready to roll.  Check out the [primer](http://cogulator.github.io/Cogulator/primer.html) & [screencast](http://cogulator.github.io/Cogulator/screencast.html)

# Working With Source
Cogulator is developed using electron. To get setup:
1. If you don't have it already, install [npm](https://www.npmjs.com/get-npm).
2. Install [electron-forge] (https://electronforge.io) from the command line with the command "npm install -g electron-forge"
3. Initialize a new project with "electron-forge init my-new-project"
4. Replace the src directory and in your new project with the src from this repo
5. cd inside of your new project directory, and use npm to install jquery with the command "npm install jquery --save"
6. While still inside of project directory, install trash with the command "npm install trash --save"

# License
Cogulator is provided gratis under an Apache 2.0 license. Feel free to look under the hood or pull the code. If you’d like to contribute to the project, get in touch. Cogulator is developed in Flash CS6 and deployed as an Air application.

# Beta
This is beta software: don’t use Cogulator for critical work. Make sure your models folder (Documents/cogulator/models) is backed up regularly. 

# Alternatives
If Cogulator doesn't work for your purposes (say, you wanted to plug into a sim or want to build models graphically), consider some of these alternatives
* [GLEAN](http://web.eecs.umich.edu/~kieras/goms.html) ([repo](https://github.com/dekieras/GLEANApp)): One of the primary inspirations for Cogulator
* [CogTool](https://github.com/cogtool/): GUI based model building
* [Apex](http://www.ai.sri.com/project/APEX): Open source architecture
* [ACT-R](http://act-r.psy.cmu.edu/): Hybrid production system architecture for detailed modeling and testing of cognitive theory
