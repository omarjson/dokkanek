namespace Dokkanek.Desktop.Services
{
    // عقد مخازن خفيف — تنفذه طبقة Data (أسماء للتحويل فقط).
    public interface IWarehouseStore
    {
        string GetName(string warehouseId);
    }
}
