import packageJson from "../package.json";

const year = new Date().getFullYear();

const asciiArt = `
=============== Loading Scraper Node ${packageJson.version}... ===============

                                                      
    .d8888b  .d8888b888d888 8888b. 88888b.  .d88b. 888d888 
    88K     d88P"   888P"      "88b888 "88bd8P  Y8b888P"   
    "Y8888b.888     888    .d888888888  88888888888888     
         X88Y88b.   888    888  888888 d88PY8b.    888     
    88888P'  "Y8888P888    "Y88888888888P"  "Y8888 888     
                                   888                     
                                   888                     
                                   888     
								                
	Copyright Ⓒ ${year}
	All Rights Reserved
`;

export default function showAsciiArt() {
	process.stdout.write(asciiArt);
	process.stdout.write("\n");
}
