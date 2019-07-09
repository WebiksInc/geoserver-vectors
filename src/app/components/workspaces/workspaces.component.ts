import { Component, OnInit } from '@angular/core';
import { IVector, IWorkspace } from '../../types';
import { FormControl, Validators } from '@angular/forms';
import { isArray } from "util";
import { GeoserverService } from '../../geoserver.service';
import { Promise } from 'q';

@Component({
  selector: 'workspaces',
  templateUrl: './workspaces.component.html',
  styleUrls: ['./workspaces.component.less']
})
export class WorkspacesComponent implements OnInit {

  workspaceControl = new FormControl('', [Validators.required]);
  workspaces: IWorkspace[];
  selecedWorkspace: string;
  workspace: IWorkspace;
  vectors: IVector[] = [];

  constructor(private geoserverService: GeoserverService) {
  }

  changeWorkspace() {
    this.selecedWorkspace = this.workspaceControl.value;
    console.log(`changeWorkspace selecedWorkspace: ${this.selecedWorkspace}`);
    this.workspace = this.workspaces.find(({ name }) => name === this.selecedWorkspace);
    this.start();
  }

  ngOnInit() {
    this.getWorkspaces();
  }

  start() {
    console.log(`start START...${this.workspace.name}`);
    if (this.workspace.vectors.length === 0) {
      this.getVectors()
        .then(() => {
          if (this.vectors && this.vectors.length === 0) {
            console.log('No Vector was found!');
          }
        });
    } else {
      this.vectors = this.workspace.vectors;
      console.log(`workspace ${this.workspace.name} already has been checked for vectors!`);
    }
  }

  getWorkspaces() {
    const getWorkspaces: any = this.geoserverService.getWorkspaces();
    getWorkspaces.then((workspaces: IWorkspace[]) => {
      this.workspaces = workspaces.filter(workspace => workspace);
    });
  }

  getVectors(): Promise<void> {
    return this.geoserverService.getVectors(this.workspace)
      .then(vectors => {
        if (vectors.length > 0) {
          if (isArray(vectors[0])) {
            vectors = vectors.flat(1);
          }
          vectors = vectors.filter(vector => (vector !== null) && (vector !== undefined));
          console.log(`workspace ${this.workspace.name} got ${vectors.length} vectors`);
        } else {
          console.log(`workspace ${this.workspace.name} has no Layers!`);
          vectors = [];
        }
        this.vectors = vectors;
        this.workspace.vectors = this.vectors;
        return;
      });
  }
}
