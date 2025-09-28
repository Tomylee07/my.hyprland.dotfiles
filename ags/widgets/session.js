import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import popupWindow from '../modules/.widgethacks/popupwindow.js';
import Gtk from "gi://Gtk?version=3.0";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../variables.js';
import { execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

const content = new Widget.Fixed() 

const grid = new Gtk.Grid({
    rowHomogeneous: true,
    columnHomogeneous: true
})

grid.get_style_context().add_class("session-grid");

const windowClose = async ( script = '' ) => {
    Utils.execAsync(script);
    App.closeWindow('session') ; 
}

grid.attach(Widget.Button({ label: '', hexpand:true, vexpand: true,  onClicked: () => windowClose('systemctl poweroff') }), 1, 1, 1, 1);
grid.attach(Widget.Button({ label: '', hexpand:true, vexpand: true,  onClicked: () => windowClose('bash -c $HOME/.config/hypr/scripts/LockScreen.sh') }), 2, 1, 1, 1);
grid.attach(Widget.Button({ label: '', hexpand:true, vexpand: true, onClicked: () => windowClose('hyprctl dispatch exit') }), 3, 1, 1, 1);
grid.attach(Widget.Button({ label: '', hexpand:true, vexpand: true, onClicked: () => windowClose('systemctl hibernate') }), 1, 2, 1, 1);
grid.attach(Widget.Button({ label: '', hexpand:true, vexpand: true, onClicked: () => windowClose('systemctl reboot') }), 2, 2, 1, 1);
grid.attach(Widget.Button({ label: '\uf0f4', hexpand:true, vexpand: true, onClicked: () => windowClose('systemctl suspend') }), 3, 2, 1, 1);

grid.set_size_request(500,200)

content.put(grid, (SCREEN_WIDTH-500)/2, (SCREEN_HEIGHT-240)/2)

const sessionWindow = popupWindow({
    name: `session`,
    className: 'session-window',
    exclusivity: 'ignore',
    visible: false,
    layer: 'overlay',
    anchor: ['top', 'bottom', 'left', 'right'],
    keymode: 'exclusive',
    child: content
})

export default () => sessionWindow


