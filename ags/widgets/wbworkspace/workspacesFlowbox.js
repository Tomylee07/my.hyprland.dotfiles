import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Service from 'resource:///com/github/Aylur/ags/service.js';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk?version=3.0';

const Hyprland = await Service.import('hyprland');

const apps = Gio.AppInfo.get_all();

const targets = [ Gtk.TargetEntry.new( 'STRING', 0, 0) ];

const appID = new Map();
apps.forEach(app => appID.set(app.get_id(), app))

const appName = new Map();
apps.forEach(app => appName.set(app.get_name(), app))

const getapp = (workspaceID) => {
    let activeapps = Hyprland.clients.filter(client => client.workspace.id == workspaceID);
    return activeapps;
}

let successdnd = false;

const draggable = (clientName) => {

    const name = clientName;
    const icon = appID.get(clientName + ".desktop")?.get_icon()
                ?? appName.get(clientName)?.get_icon()
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

                let originWorkspace = self.get_parent().get_parent().name;
                let appdata = { originWorkspace: originWorkspace, name: name };
                data.set_text(JSON.stringify(appdata), -1);
            });

            self.connect('drag-end', (widget, context) => { 

                self.get_style_context().remove_class("dragging");

                if (successdnd){
                    let parent = self.get_parent().get_parent();
                    let removed = parent.get_children().find( child => child.child.name === self.name );
                    parent.remove(removed);
                    parent.show_all();
                    successdnd = false;

                } else { successdnd = false }
            });

            self.connect('destroy', () => {

                self.disconnect(buttonBegin);
                self.disconnect(buttonSet);
                self.disconnect(buttonRequest);
            });
        }
    })
}

export default (workspace) => {

    let targetWorkspace = 0;

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

                    self.add(draggable(clientID));
                    self.show_all()
                }
            });

            Hyprland.connect('client-removed', (address) => { 
                
                if ( workspace == address.active.workspace.id ) {

                    let activeClients = getapp(workspace).map( client => client.class );

                    self.get_children().forEach( child => self.remove(child) );
                    activeClients.forEach( client => self.add(draggable(client)) );
                    self.show_all()
                }
            });

            Hyprland.connect('event', (name, other) => {

                if ( workspace === targetWorkspace && other === 'movewindowv2' ){ 
                    
                    self.add(draggable(name.active.client.class))
                    self.show_all()
                    targetWorkspace = 0
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

                let { originWorkspace, name } = JSON.parse(data.get_text());

                if ( originWorkspace == workspace ){ successdnd = false; return }

                targetWorkspace = workspace

                Hyprland.message(`dispatch focuswindow ${name}`);
                Hyprland.message(`dispatch movetoworkspace ${workspace}`);
                successdnd = true 
                Gtk.drag_finish(context, true, false, time);

            })
        }
    });

    for (const client of getapp(workspace))
        workspacebase.add(draggable(client.class));
        workspacebase.show_all();

    return overlay

}
