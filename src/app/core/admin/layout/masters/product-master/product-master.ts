import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, Observable } from 'rxjs';
import { ToastService } from '../../../../services/toast.service';
import { extractSuccessMessage } from '../../../../models/api-response.model';
import { ProductService } from '../../../../services/ product.service';
import { CategoryService } from '../../../../services/category.service';
import { BrandService } from '../../../../services/brand.service';
import { UnitService } from '../../shared/unit.service';
import { Category } from '../../../../models/category.model';
import { Brand } from '../../../../models//brand.model';
import { UnitOption } from '../../../../models/unit.model';
import { Packsizes, ProductMaster } from '../../../../../core/models/product.model';
import { UploadDto } from '../../../../models/upload.model';
import { validateProductImage } from '../../shared/image-validation';
import { UploadService } from '../../../../services/upload.service';

@Component({
  selector: 'app-product-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    TranslatePipe,
  ],
  templateUrl: './product-master.html',
  styleUrl: './product-master.scss',
})
export class ProductMasterComponent implements OnInit {
  private imageUrl: string | null = null;

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private unitService = inject(UnitService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private uploadService = inject(UploadService);
  private toastService = inject(ToastService);
constructor(
) {}
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  units = signal<UnitOption[]>([]);

  isEdit = signal(false);
  saving = signal(false);
  taxColumns = ['taxName', 'taxRate', 'active', 'remove'];
  form = this.fb.nonNullable.group({
    productCd: [null as number | null],
    productName: ['', Validators.required],
    imagePath: [null as string | null],
    productDesc: [''],
    categoryCd: [null as number | null],
    categoryName: [''],
    brandCd: [null as number | null],
    brandName: [''],
    unitCd: [null as number | null],
    unitName: [''],
    hsnCode: [''],
    mrp: [0],
    sellingPrice: [0],
    purchasePrice: [0],
    stockQty: [0],
    minStockQty: [0],
    gstPercent: [0],
    active: [true],
    inStock: [true],
    productTaxMstDtos: this.fb.array([]),
    packsizes: this.fb.array([]),
    featured: [false],
    trending: [false],
    recentlyAdded: [false],
    bestSellers: [false],
     usage:[null as string | null],
  dose: [null as string | null],
  precaution: [null as string | null],
  });
  selectedImageFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  imageError = signal<string | null>(null);
  uploadingImage = signal(false);

  get taxRows(): FormArray {
    return this.form.controls.productTaxMstDtos as FormArray;
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((c) => this.categories.set(c));
    this.brandService.getAll().subscribe((b) => this.brands.set(b));
    this.unitService.getAll().subscribe((u) => this.units.set(u));
    this.taxRows.clear();
    this.packRows.clear();
    const productCd = this.route.snapshot.paramMap.get('id');
    if (productCd) {
      this.isEdit.set(true);
      this.loadProduct(Number(productCd));
    }
  }
  taxTableRows: any[] = [];
  private loadProduct(productCd: number): void {
    this.productService.getProductMaster(productCd).subscribe((product) => {
      this.form.patchValue(product);
      this.taxRows.clear();
      this.imagePreviewUrl.set(this.uploadService.getFileUrl(product.imagePath));

      (product.productTaxMstDtos ?? []).forEach((tax) => {
        this.taxRows.push(this.buildTaxRow(tax));
      });
      (product.packsizes ?? []).forEach((pack) => {
        this.packRows.push(this.buildPackRow(pack));
      });
      this.packTableRows = [...this.packRows.controls];
      this.taxTableRows = [...this.taxRows.controls];

      console.log('Tax count:', this.taxRows.length);
      console.log('Tax values:', this.taxRows.value);
    });
  }

  // private buildTaxRow(tax?: { productTaxCd?: number | null; productCd?: number | null; taxName: string; taxRate: number; active: boolean }) {
  //   return this.fb.group({
  //     // Hidden identifiers: null on add, populated (and hidden in the UI) on edit
  //     productTaxCd: [tax?.productTaxCd ?? null],
  //     productCd: [tax?.productCd ?? null],
  //     taxName: [tax?.taxName ?? '', Validators.required],
  //     taxRate: [tax?.taxRate ?? 0, [Validators.required, Validators.min(0)]],
  //     active: [tax?.active ?? true],
  //   });
  // }
  packColumns = ['packSize', 'unitCd', 'sellingPrice','mrpPrice','inStock','defaultYn' ,'active', 'remove'];
  taxNameOptions: string[] = ['SGST', 'CGST', 'IGST', 'CESS'];
  private buildTaxRow(tax?: {
    productTaxCd?: number | null;
    productCd?: number | null;
    taxName?: string | null;
    taxRate?: number | null;
    active?: boolean | null;
  }) {
    const productCd = tax?.productCd ?? (this.isEdit() ? this.form.controls.productCd.value : null);

    return this.fb.group({
      productTaxCd: [tax?.productTaxCd ?? null],
      productCd: [productCd],

      taxName: [tax?.taxName ?? '', Validators.required],

      taxRate: [tax?.taxRate ?? 0, [Validators.required, Validators.min(0)]],

      active: [tax?.active ?? true],
    });
  }
  // private buildTaxRow(tax?: {
  //   productTaxCd?: number | null;
  //   productCd?: number | null;
  //   taxName: string;
  //   taxRate: number;
  //   active: boolean;
  // }) {
  //   return this.fb.group({
  //     productTaxCd: [tax?.productTaxCd ?? null],
  //     productCd: [tax?.productCd ?? null],
  //     taxName: [tax?.taxName ?? '', Validators.required],
  //     taxRate: [tax?.taxRate ?? 0, [Validators.required, Validators.min(0)]],
  //     active: [tax?.active ?? true],
  //   });
  // }
  addTaxRow(): void {
    const row = this.buildTaxRow();

    this.taxRows.push(row);

    // VERY IMPORTANT
    this.taxTableRows = [...this.taxRows.controls];

    console.log('After add:', this.taxRows.value);
  }
  removeTaxRow(index: number): void {
    this.taxRows.removeAt(index);

    this.taxTableRows = [...this.taxRows.controls];
  }

  onCategoryChange(categoryCd: number): void {
    const category = this.categories().find((c) => c.categoryCd === categoryCd);
    this.form.patchValue({ categoryName: category?.categoryName ?? '' });
  }

  onBrandChange(brandCd: number): void {
    const brand = this.brands().find((b) => b.brandCd === brandCd);
    this.form.patchValue({ brandName: brand?.brandName ?? '' });
  }

  onUnitChange(unitCd: number): void {
    const unit = this.units().find((u) => u.unitCd === unitCd);
    this.form.patchValue({ unitName: unit?.unitName ?? '' });
  }

  // submit(): void {
  //   if (this.form.invalid) {
  //     this.form.markAllAsTouched();
  //     return;
  //   }

  //   this.saving.set(true);
  //   const payload = this.form.getRawValue() as unknown as ProductMaster;

  //   this.productService
  //     .save(payload)
  //     .pipe(finalize(() => this.saving.set(false)))
  //     .subscribe({
  //       next: () => this.router.navigate(['/admin/master/product']),
  //     });
  // }
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.imageError()) {
      return;
    }

    this.saving.set(true);

    // if (this.isEdit()) {
    //   this.saveWithExistingProductCd();
    // } else {
    //   this.saveNewProductThenUploadImage();
    // }
    this.saveNewProduct();
  }

  /** Edit mode: productCd already known — upload (if a new file was picked) then save. */
  private saveWithExistingProductCd(): void {
    const productCd = this.form.controls.productCd.value!;

    if (!this.selectedImageFile()) {
      this.persist();
      return;
    }

    this.uploadImage(productCd).subscribe({
      next: (imagePath) => {
        this.form.patchValue({ imagePath });
        this.persist();
      },
      error: () => this.saving.set(false),
    });
  }
  private persist(): void {
    const payload = this.form.getRawValue() as unknown as ProductMaster;
    this.productService
      .save(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res: any) => {
          this.toastService.success(extractSuccessMessage(res, 'Product saved successfully'));
          this.router.navigate(['/admin/master/product']);
        },
      });
  }

  /** Add mode: no productCd yet — save the product first, then upload using the newly created productCd. */
  private saveNewProductThenUploadImage(): void {
    const initialPayload = this.form.getRawValue() as unknown as ProductMaster;

    this.productService.save(initialPayload).subscribe({
      next: (created: any) => {
        const newProductCd = (created as ProductMaster)?.productCd ?? created?.data?.[0]?.productCd;

        if (!this.selectedImageFile() || !newProductCd) {
          this.saving.set(false);
          this.toastService.success(extractSuccessMessage(created, 'Product saved successfully'));
          this.router.navigate(['/admin/master/product']);
          return;
        }

        this.form.patchValue({ productCd: newProductCd });

        this.uploadImage(newProductCd).subscribe({
          next: (imagePath) => {
            this.form.patchValue({ imagePath });
            this.persist();
          },
          error: () => {
            this.saving.set(false);
            this.router.navigate(['/admin/master/product']);
          },
        });
      },
      error: () => this.saving.set(false),
    });
  }
  private saveNewProduct(): void {
    const payload = this.form.getRawValue() as unknown as ProductMaster;

    this.productService.save(payload).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.toastService.success(extractSuccessMessage(res, 'Product saved successfully'));
        this.router.navigate(['/admin/master/product']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
  cancel(): void {
    this.router.navigate(['/admin/master/product']);
  }
  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file after a failed validation
    if (!file) return;

    this.imageError.set(null);
    const result = await validateProductImage(file);

    if (!result.valid) {
      this.imageError.set(result.errorKey ?? 'IMAGE_ERROR_INVALID_FILE');
      return;
    }

    this.selectedImageFile.set(file);
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  removeSelectedImage(): void {
    this.selectedImageFile.set(null);
    // this.imagePreviewUrl.set(this.uploadService.getFileUrl(this.form.controls.productCd.value ? this.form.getRawValue().imagePath : null));
    this.imageError.set(null);
  }
  private uploadImage(productCd: number): Observable<string> {
    this.uploadingImage.set(true);

    const meta: UploadDto = {
      transactionType: 'product_master',
      primaryValue: productCd,
    };

    return this.uploadService
      .uploadFileWithPayload(this.selectedImageFile()!, meta)
      .pipe(finalize(() => this.uploadingImage.set(false)));
  }
  // Add to the form group definition, alongside productTaxMstDtos:

  // Add alongside taxTableRows:
  packTableRows: any[] = [];

  get packRows(): FormArray {
    return this.form.controls.packsizes as FormArray;
  }

  private buildPackRow(pack?: {
    packPriceId?: number | null;
    productCd?: number | null;
    sellingPrice?: number | null;
    packSize?: number | null;
    active?: boolean | null;
    unitCd?: number | null;
    unitName?: string | null;
    mrpPrice: number| null;
    inStock: boolean| null;
    defaultYn: boolean| null;
  }) {
    const productCd =
      pack?.productCd ?? (this.isEdit() ? this.form.controls.productCd.value : null);

    return this.fb.group({
      packPriceId: [pack?.packPriceId ?? null],
      productCd: [productCd],
      sellingPrice: [pack?.sellingPrice ?? 0, [Validators.required, Validators.min(0)]],
      packSize: [pack?.packSize ?? 0, [Validators.required, Validators.min(0)]],
      active: [pack?.active ?? true],
      unitCd: [pack?.unitCd ?? null, Validators.required],
      unitName: [pack?.unitName ?? ''],
     mrpPrice: [pack?.mrpPrice ?? 0, [Validators.required, Validators.min(0)]],
      inStock: [pack?.inStock ?? false],
      defaultYn: [pack?.defaultYn ?? false],

    });
  }

  addPackRow(): void {
    const row = this.buildPackRow();
    this.packRows.push(row);
    this.packTableRows = [...this.packRows.controls];
  }

  removePackRow(index: number): void {
    this.packRows.removeAt(index);
    this.packTableRows = [...this.packRows.controls];
  }

  onPackUnitChange(row: any, unitCd: number): void {
    const unit = this.units().find((u) => u.unitCd === unitCd);
    row.patchValue({ unitName: unit?.unitName ?? '' });
  }
}
