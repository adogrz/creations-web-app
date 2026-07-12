import { uploadImageAction } from '@/app/admin/actions/upload-actions'
import { IMAGE_UPLOAD_INGRESS_ERROR } from '@/lib/image-upload-validation'

export async function uploadImage(formData: FormData) {
  try {
    return await uploadImageAction(formData)
  } catch {
    return { error: IMAGE_UPLOAD_INGRESS_ERROR }
  }
}
