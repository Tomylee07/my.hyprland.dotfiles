import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Service from 'resource:///com/github/Aylur/ags/service.js';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';

const Hyprland = await Service.import('hyprland');

const apps = Gio.AppInfo.get_all();

const targets = [ Gtk.TargetEntry.new( 'STRING', 0, 0) ];

const appName = new Map();
apps.forEach(app => appName.set(app.get_id(), app))

const getapp = (workspaceID) => {

    let activeapps = Hyprland.clients.filter(client => client.workspace.id == workspaceID);
    return activeapps;
}

let successdnd = false;

const draggable = (workspaceID, clientName) => {

    const name = getapp(workspaceID).find( client => client.class == clientName).class;
    const icon = appName.get(clientName + ".desktop")?.get_icon()
                ?? Gio.ThemedIcon.new("application-default-icon");

    return new Widget.Button({
        name: name,
        className: 'draggable',
        child: new Gtk.Image({ gicon: icon, icon_size: 32, pixel_size: 32}),
        setup: self => {

            self.drag_source_set(Gdk.ModifierType.BUTTON1_MASK, targets, Gdk.DragAction.MOVE);

            let buttonBegin = self.connect('drag-begin', (widget, context) => {
                Gtk.drag_set_icon_gicon(context, icon, 0, 0);
                self.get_style_context().add_class("dragging");
             });

            let buttonRequest = self.connect('drag-data-get', (widget, context, data, info, time) => { 
                let appdata = { workspaceID: workspaceID, name: name };
                data.set_text(JSON.stringify(appdata), -1);
            });

            self.connect('drag-end', (widget, context) => { 
                self.get_style_context().remove_class("dragging");

                if (successdnd){
                    let parent = self.get_parent().get_parent()
                    parent.remove(self)
                    parent.show_all()
                } else { successdnd = false }

            });

            self.connect('destroy', () => {
                self.disconnect(buttonBegin);
                self.disconnect(buttonSet)
            });
        }
    })
}

export default (workspace) => {

    let workspacebase = new Widget.FlowBox({
        name: `${workspace}`,
        className: 'workspace',
        max_children_per_line: 3,
        homogeneous: true,  
        setup(self) {
            
            Hyprland.connect('client-added', (address) => { 
                
                if ( workspace == address.active.workspace.id) {

                    let activeClients = getapp(workspace).map( client => client.class );
            
                    let clientID = activeClients.find( client => client == address.active.client.class);

                    self.add(draggable(workspace, clientID));
                    self.show_all()
                }
            });

            Hyprland.connect('client-removed', (address) => { 
                
                if ( workspace == address.active.workspace.id ) {

                    self.get_children().forEach( child => self.remove(child) )

                    let activeClients = getapp(workspace).map( client => client.class );

                    for (const i of activeClients ){ self.add(draggable(workspace, i)) }
                    
                    self.show_all()

                }
            });
        }
    });

    let overlay = new Widget.Overlay({
        child: workspacebase,
        canFocus: false,
        setup: self => {

            self.drag_dest_set(Gtk.DestDefaults.ALL, targets, Gdk.DragAction.MOVE);

            self.connect("drag-data-received", (widget, context, x, y, data, info, time) => {

                let { workspaceID, name } = JSON.parse(data.get_text());

                //if ( workspaceID == workspace ) { return };

                Hyprland.messageAsync(`dispatch focuswindow ${name}`);
                Hyprland.messageAsync(`dispatch movetoworkspace ${workspace}`);
                widget.child.add(draggable(workspaceID, name));
                console.log(getapp(workspace));
                //error al recivir por segunda vez, getapp() undefined
                widget.child.show_all();
                successdnd = true 
                Gtk.drag_finish(context, true, false, time);

            })
        }
    });

    for (const i of getapp(workspace))
        workspacebase.add(draggable(workspace, i.class));
        workspacebase.show_all();

    return overlay

}
