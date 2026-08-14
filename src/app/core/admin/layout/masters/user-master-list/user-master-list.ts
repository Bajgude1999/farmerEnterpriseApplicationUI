import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { UserMasterService } from '../../shared/user-master.service';
import { UploadService } from '../../../../services/upload.service';
import { UserMaster } from '../../../../models/user.model';

@Component({
  selector: 'app-user-master-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './user-master-list.html',
  styleUrl: '../../shared/admin-table.scss',
})
export class UserMasterList implements OnInit {
  private userService = inject(UserMasterService);
  upload = inject(UploadService);
  private router = inject(Router);

  users = signal<UserMaster[]>([]);
  loading = signal(true);
  columns = ['photo', 'fullName', 'mobNo', 'roleName', 'district', 'state', 'verified', 'block', 'active', 'actions'];

  ngOnInit(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/master/user/add']);
  }

  goToEdit(user: UserMaster): void {
    this.router.navigate(['/admin/master/user/edit', user.userId]);
  }
}