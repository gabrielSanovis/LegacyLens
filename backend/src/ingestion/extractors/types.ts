export interface ASTNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  childForFieldName(fieldName: string): ASTNode | null;
  children: ASTNode[];
}

export interface ExtractedSaga {
  name: string;
  file_path: string;
  loc: number;
  start_line: number;
  end_line: number;
}

export interface ExtractedReducer {
  name: string;
  file_path: string;
  slice_name: string;
}

export interface ExtractedAction {
  type_string: string;
  file_path: string;
}

export interface ExtractedImport {
  from: string;
  to: string;
  loc: number;
}

export interface ExtractedWatch {
  saga: string;
  action: string;
  watcher_type: string;
  file_line: number;
}

export interface ExtractedDispatch {
  saga: string;
  action: string;
  file_line: number;
}

export interface ExtractedCall {
  saga: string;
  target_saga: string;
  via_effect: string;
  file_line: number;
}

export interface ExtractedGraph {
  sagas: ExtractedSaga[];
  reducers: ExtractedReducer[];
  actions: ExtractedAction[];
  imports: ExtractedImport[];
  edges: {
    watches: ExtractedWatch[];
    dispatches: ExtractedDispatch[];
    calls: ExtractedCall[];
    selects: any[];
  };
}
