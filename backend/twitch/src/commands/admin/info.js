export default {
    name: 'info',
    description: 'Writes the following text in color in the chat!',
    label: 'info',
    // create valid_args with integers from 1 to 500
    valid_args: [...Array(500).keys()].map(i => i + 1),

    execute (command, twitchBot1) {

    },


    help(command, twitchBot1) {

    }
};