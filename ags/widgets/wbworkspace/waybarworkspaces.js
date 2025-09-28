import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import popupWindow from '../../modules/.widgethacks/popupwindow.js';
import Gtk from "gi://Gtk?version=3.0";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../variables.js';
import Workspace from './workspacesFlowbox.js';

const fixed = new Widget.Fixed();

const wbwGrid = (columns, rows) => {

    let grid = new Gtk.Grid({
        columnHomogeneous:true,
        rowHomogeneous:true,
    })

    let id = 1;

    for ( let i = 1; i <= rows; i++ ){
        for( let j = 1; j <= columns; j++ ){

            let workspace = Workspace(id);

            let label = new Widget.Label({ 
                label: `${id}`, 
                className: 'workspaceLabel', 
                xalign: 0.5, 
                yalign: 0.5
            });

            workspace.add_overlay(label);
            workspace.set_overlay_pass_through(label, true);

            let hoverIT = new Widget.EventBox({ 
                child: workspace,
                setup: self => { 

                    self.connect('enter-notify-event', () => {
                        self.child.child.get_style_context().add_class("hovered");
                        label.get_style_context().add_class("hovered");
                    });

                    self.connect('leave-notify-event', () => {
                        self.child.child.get_style_context().remove_class("hovered");
                        label.get_style_context().remove_class("hovered");
                    })
                }
            });

            grid.attach( hoverIT, j, i, 1, 1);
            id++;
        }
    }

    grid.get_style_context().add_class("wbwGrid");
    //grid.set_size_request(500,200);
    fixed.put(grid, 200, 450);

    return fixed 
} 

const wbworkSpace = popupWindow({
    name:'wbworkspace',
    className:'window-wbworkspace',
    exclusivity:'ignore',
    visible: false,
    layer:'overlay',
    anchor: ['top', 'bottom', 'left', 'right'],
    margins: [0, 0, 30, 0],
    child: wbwGrid(4,2)
})

export default () => wbworkSpace
