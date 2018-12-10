import packageJson from '../package.json';

const year = new Date().getFullYear();

const asciiArt = `       ____			Loading Scraper Node ${packageJson.version}...
      /___/\\_			
     _\\   \\/_/\\__						
   __\\       \\/_/\\					
   \\   __    __ \\ \\					
  __\\  \\_\\   \\_\\ \\ \\   __			
 /_/\\\\   __   __  \\ \\_/_/\\			
 \\_\\/_\\__\\/\\__\\/\\__\\/_\\_\\/		
    \\_\\/_/\\       /_\\_\\/		Copyright Ⓒ ${year} 
       \\_\\/       \\_\\/		All Rights Reserved
`;

export default function showAsciiArt() {
	process.stdout.write(asciiArt);
	process.stdout.write('\n');
}
