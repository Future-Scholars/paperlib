import Foundation
import SwiftUI
import AppKit
import RealmSwift
import Cocoa


struct TableView: View {
    @ObservedResults(PaperEntity.self) var entities
    @State private var rowSelected = -1
    @State private var selectedName = ""
    @State private var selectedRef: UUID? = nil
    @State private var selectedCleared = false

    var body: some View {
        List {
        }
        TableVC(entities: $entities, rowSelected: $rowSelected, selectedName: $selectedName, selectedCleared: $selectedCleared)
            .frame(minWidth: 450, minHeight: 200)
    }
    
    
    init() {
        test()
    }
    
    func test() {
        print(type(of: $entities))
        exit(0)
    }
}


struct TableVC: NSViewControllerRepresentable {
    @Binding var entities: ObservedResults<PaperEntity>
    @Binding var rowSelected: Int
    @Binding var selectedName: String
    @Binding var selectedCleared: Bool

    func makeNSViewController(context: Context) -> NSViewController {
        let tableVC = TableViewController()
        return tableVC
    }

    func updateNSViewController(_ nsViewController: NSViewController, context: Context) {
        guard let tableVC = nsViewController as? TableViewController else {return}
        tableVC.setContents(items: items)
        tableVC.tableView?.delegate = context.coordinator
        guard rowSelected >= 0 else {
            tableVC.arrayController.removeSelectionIndexes([0])
            return
        }
        tableVC.arrayController.setSelectionIndex(rowSelected)
        tableVC.tableView.scrollRowToVisible(rowSelected)
    }

    class Coordinator: NSObject, NSTableViewDelegate {

        var parent: TableVC

        init(_ parent: TableVC) {
            self.parent = parent
        }

        func tableViewSelectionDidChange(_ notification: Notification) {
            guard let tableView = notification.object as? NSTableView else {return}
            guard self.parent.items.count > 0 else {return}
            guard tableView.selectedRow >= 0 else {
                self.parent.rowSelected = -1
                return
            }
            self.parent.rowSelected = tableView.selectedRow
            self.parent.selectedName = self.parent.items[tableView.selectedRow].title
        }

    }

    func makeCoordinator() -> Coordinator {
        return Coordinator(self)
    }
}

class TableViewController: NSViewController {
    
    @objc dynamic var contents: ObservedResults<PaperEntity>

    @IBOutlet weak var tableView: NSTableView!
    @IBOutlet var arrayController: NSArrayController!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do view setup here.
    }
    
    @IBAction func nameCellEdited(_ sender: Any) {} // stub for delegate
    
    @IBAction func clearedCellToggled(_ sender: Any) {} // stub for delegate

    func setContents(entities: ObservedResults<PaperEntity>) -> Void {
        contents = items
    }
    
}


struct TableView_Previews: PreviewProvider {
    static var previews: some View {
        TableView()
    }
}

