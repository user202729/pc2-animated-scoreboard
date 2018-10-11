# PC^2 Animated Scoreboard

## Requirements

- Node.js >= 7.0.0

## Installation
Download the source. Run `npm install`.

## Configuration
Change the settings in `config.json`. 

- `xml_path` should be where the `results.xml` file is located. Usually it's within the PC^2 installation folder.
Note that the file is only generated/updated if `pc2board` is run.
- `port` is where you want the server to be running on.
- `disp_name`: The displayed name of teams, override the PC^2 teamName if present. For example:

      "disp_name": {
          "1": "Display name of team1",
          "5": "Display name of team5"
      }

## Running
`npm start`
