import * as userService from '../services/userService'

export async function permissionHelper(module:any,req_type:any,user_id:any){

    const getPermissionType = await userService.getPermissionType(user_id,module)
    console.log(getPermissionType)
    if(getPermissionType.rows.length>0){
    const document_name = getPermissionType.rows[0].module_name
    const permission = getPermissionType.rows[0][req_type]
      if(document_name === module && permission ){
        return true
      }else{
         return false
      }

    }else{
        throw new Error("user permission denied ")
    }

}